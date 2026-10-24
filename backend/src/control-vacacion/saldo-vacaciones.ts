import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

// Código de Trabajo de Guatemala, art. 130: 15 días por cada año de servicio continuo
export const DIAS_VACACIONES_POR_ANIO = 15;

type Cliente = Prisma.TransactionClient;

const MS_DIA = 1000 * 60 * 60 * 24;
const DESFASE_GUATEMALA_MS = 6 * 60 * 60 * 1000; // UTC-6, sin horario de verano

// Día calendario en Guatemala: las fechas llegan con distintas horas (00:00Z, 06:00Z...)
// y deben compararse por día, no por instante
function diaGuatemala(fecha: Date): number {
  const t = fecha.getTime();
  // Una fecha sin hora ("2026-05-01") llega como medianoche UTC: ya es el día calendario
  if (t % MS_DIA === 0) return t / MS_DIA;
  // El resto (p. ej. medianoche de Guatemala = 06:00Z, lo que envía el datepicker) se lleva a UTC-6
  return Math.floor((t - DESFASE_GUATEMALA_MS) / MS_DIA);
}

// Días que abarca un periodo de vacaciones, contando el día inicial y el final
export function diasDelPeriodo(fechaInicio: Date, fechaFin: Date): number {
  return diaGuatemala(fechaFin) - diaGuatemala(fechaInicio) + 1;
}

// Años de servicio cumplidos a la fecha indicada
export function aniosCumplidos(fechaIngreso: Date, aFecha = new Date()): number {
  let anios = aFecha.getFullYear() - fechaIngreso.getFullYear();
  const aniversarioEsteAnio = new Date(fechaIngreso);
  aniversarioEsteAnio.setFullYear(aFecha.getFullYear());
  if (aFecha < aniversarioEsteAnio) anios--;
  return Math.max(0, anios);
}

/**
 * Saldo de vacaciones de un empleado según su antigüedad.
 * Ganados = 15 días por año cumplido; gozados = días descontados por vacaciones activas.
 * `excluirIncidencia` permite recalcular el saldo al editar una solicitud existente.
 */
export async function calcularSaldoVacaciones(
  db: Cliente,
  idEmpleado: number,
  excluirIncidencia?: number,
) {
  const empleado = await db.empleado.findUnique({
    where: { IdEmpleado: idEmpleado },
    select: { FechaIngresa: true },
  });
  if (!empleado) throw new NotFoundException(`Empleado #${idEmpleado} no encontrado`);

  const anios = aniosCumplidos(empleado.FechaIngresa);
  const diasGanados = anios * DIAS_VACACIONES_POR_ANIO;

  const gozados = await db.detalleControlVacacion.aggregate({
    _sum: { DiasDescontados: true },
    where: {
      Activo: true,
      ControlVacacion: { IdEmpleado: idEmpleado },
      Incidencia: {
        Activo: true,
        ...(excluirIncidencia ? { IdIncidencia: { not: excluirIncidencia } } : {}),
      },
    },
  });
  const diasGozados = Number(gozados._sum.DiasDescontados ?? 0);

  const proximoAniversario = new Date(empleado.FechaIngresa);
  proximoAniversario.setFullYear(empleado.FechaIngresa.getFullYear() + anios + 1);

  return {
    fechaIngreso: empleado.FechaIngresa,
    aniosServicio: anios,
    diasGanados,
    diasGozados,
    diasDisponibles: diasGanados - diasGozados,
    proximoAniversario,
  };
}

/**
 * Valida una solicitud de vacaciones: fechas coherentes, sin traslape con otras vacaciones
 * activas del empleado y con saldo suficiente. Devuelve los días que se descontarán.
 */
export async function validarSolicitudVacaciones(
  db: Cliente,
  idEmpleado: number,
  fechaInicio: Date,
  fechaFin: Date,
  excluirIncidencia?: number,
): Promise<number> {
  const inicio = diaGuatemala(fechaInicio);
  const fin = diaGuatemala(fechaFin);
  if (fin < inicio) {
    throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio');
  }

  const vacaciones = await db.incidencia.findMany({
    where: {
      IdEmpleado: idEmpleado,
      TipoIncidencia: 'Vacaciones',
      Activo: true,
      ...(excluirIncidencia ? { IdIncidencia: { not: excluirIncidencia } } : {}),
    },
    select: { FechaInicio: true, FechaFin: true },
  });
  const traslape = vacaciones.find(
    (v) => diaGuatemala(v.FechaInicio) <= fin && diaGuatemala(v.FechaFin) >= inicio,
  );
  if (traslape) {
    const f = (d: Date) => new Date(d.getTime() - DESFASE_GUATEMALA_MS).toISOString().slice(0, 10);
    throw new BadRequestException(
      `El empleado ya tiene vacaciones registradas del ${f(traslape.FechaInicio)} al ${f(traslape.FechaFin)}`,
    );
  }

  const dias = diasDelPeriodo(fechaInicio, fechaFin);
  const saldo = await calcularSaldoVacaciones(db, idEmpleado, excluirIncidencia);
  if (dias > saldo.diasDisponibles) {
    throw new BadRequestException(
      `Saldo de vacaciones insuficiente: solicita ${dias} días y tiene ${saldo.diasDisponibles} disponibles ` +
        `(${saldo.aniosServicio} años de servicio, ${saldo.diasGanados} ganados, ${saldo.diasGozados} gozados)`,
    );
  }

  return dias;
}

/** Registra el descuento de días de una incidencia en el control del año en curso. */
export async function registrarDescuentoVacaciones(
  db: Cliente,
  idEmpleado: number,
  idIncidencia: number,
  dias: number,
) {
  const anioActual = new Date().getFullYear();
  let control = await db.controlVacacion.findFirst({
    where: { IdEmpleado: idEmpleado, AnioCorriente: anioActual, Activo: true },
  });

  if (!control) {
    control = await db.controlVacacion.create({
      data: {
        IdEmpleado: idEmpleado,
        AnioCorriente: anioActual,
        DiasGanados: DIAS_VACACIONES_POR_ANIO,
        DiasGozados: 0,
        Activo: true,
      },
    });
  }

  await db.detalleControlVacacion.create({
    data: {
      IdControlVacacion: control.IdControlVacacion,
      IdIncidencia: idIncidencia,
      DiasDescontados: dias,
      FechaRegistro: new Date(),
      Activo: true,
    },
  });

  await db.controlVacacion.update({
    where: { IdControlVacacion: control.IdControlVacacion },
    data: { DiasGozados: { increment: dias } },
  });
}
