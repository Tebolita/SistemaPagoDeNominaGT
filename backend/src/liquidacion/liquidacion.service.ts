import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { IsInt, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CalcularLiquidacionDto {
  @IsInt() @Min(1)
  @Transform(({ value }) => parseInt(value))
  idEmpleado: number;

  @IsString()
  fechaLiquidacion: string;

  @IsOptional() @IsString()
  motivoSalida?: string;

  @IsOptional() @IsNumber() @Min(0)
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : 0)
  diasVacacionesPendientes?: number;

  @IsOptional() @IsString()
  observaciones?: string;
}

@Injectable()
export class LiquidacionService {
  constructor(private prisma: PrismaService) {}

  // ── Calcular (sin guardar) ────────────────────────────────────────
  async calcular(dto: CalcularLiquidacionDto) {
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: dto.idEmpleado },
      include: {
        Salario: {
          where: { NOT: { Activo: false } },
          orderBy: { FechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
    });

    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const salarioBase = empleado.Salario[0]
      ? parseFloat(empleado.Salario[0].SalarioBase.toString())
      : 0;

    const fechaIngreso    = new Date(empleado.FechaIngresa);
    const fechaLiquidacion = new Date(dto.fechaLiquidacion);

    // Años de servicio con decimales
    const msAnio = 1000 * 60 * 60 * 24 * 365.25;
    const aniosServicio = Math.max(0, (fechaLiquidacion.getTime() - fechaIngreso.getTime()) / msAnio);

    // Indemnización: 1 salario mensual por año completo (Guatemala art. 82 CT)
    const indemnizacion = salarioBase * Math.floor(aniosServicio);

    // Vacaciones pendientes: días × (salario/30) × 1.25 (con goce de sueldo)
    const diasVac = dto.diasVacacionesPendientes ?? 0;
    const vacacionesPendientes = diasVac > 0 ? (salarioBase / 30) * diasVac * 1.25 : 0;

    // Aguinaldo proporcional (Dic): meses transcurridos desde Dic anterior / 12
    const mesesAguinaldo = this.mesesDesdeUltimoPago(fechaLiquidacion, 11); // nov → dic
    const aguinaldoProporcional = (salarioBase / 12) * mesesAguinaldo;

    // Bono 14 proporcional (Jul): meses transcurridos desde Jul anterior / 12
    const mesesBono14 = this.mesesDesdeUltimoPago(fechaLiquidacion, 6); // jun → jul
    const bono14Proporcional = (salarioBase / 12) * mesesBono14;

    const totalLiquidacion = indemnizacion + vacacionesPendientes + aguinaldoProporcional + bono14Proporcional;

    return {
      idEmpleado:    dto.idEmpleado,
      empleado:      `${empleado.Nombres} ${empleado.Apellidos}`,
      salarioBase,
      fechaIngreso:  empleado.FechaIngresa.toISOString().split('T')[0],
      fechaLiquidacion: dto.fechaLiquidacion,
      aniosServicio: parseFloat(aniosServicio.toFixed(2)),
      motivoSalida:  dto.motivoSalida ?? null,
      indemnizacion: parseFloat(indemnizacion.toFixed(2)),
      vacacionesPendientes: parseFloat(vacacionesPendientes.toFixed(2)),
      aguinaldoProporcional: parseFloat(aguinaldoProporcional.toFixed(2)),
      bono14Proporcional: parseFloat(bono14Proporcional.toFixed(2)),
      totalLiquidacion: parseFloat(totalLiquidacion.toFixed(2)),
      observaciones: dto.observaciones ?? null,
    };
  }

  // ── Guardar liquidación calculada ─────────────────────────────────
  async crear(dto: CalcularLiquidacionDto) {
    const calc = await this.calcular(dto);
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: dto.idEmpleado },
      select: { FechaIngresa: true },
    });

    return this.prisma.liquidacionEmpleado.create({
      data: {
        IdEmpleado:            dto.idEmpleado,
        FechaIngreso:          new Date(empleado!.FechaIngresa),
        FechaLiquidacion:      new Date(dto.fechaLiquidacion),
        MotivoSalida:          dto.motivoSalida ?? null,
        AniosServicio:         calc.aniosServicio,
        SalarioBase:           calc.salarioBase,
        Indemnizacion:         calc.indemnizacion,
        VacacionesPendientes:  calc.vacacionesPendientes,
        AguinaldoProporcional: calc.aguinaldoProporcional,
        Bono14Proporcional:    calc.bono14Proporcional,
        TotalLiquidacion:      calc.totalLiquidacion,
        Observaciones:         dto.observaciones ?? null,
        Estado:                'CALCULADA',
        Activo:                true,
      },
      include: { Empleado: { select: { Nombres: true, Apellidos: true } } },
    });
  }

  async findAll() {
    const lista = await this.prisma.liquidacionEmpleado.findMany({
      where: { NOT: { Activo: false } },
      include: { Empleado: { select: { Nombres: true, Apellidos: true, IdEmpleado: true } } },
      orderBy: { FechaLiquidacion: 'desc' },
    });
    return lista.map(l => ({
      ...l,
      SalarioBase:           parseFloat(l.SalarioBase.toString()),
      Indemnizacion:         parseFloat(l.Indemnizacion.toString()),
      VacacionesPendientes:  parseFloat(l.VacacionesPendientes.toString()),
      AguinaldoProporcional: parseFloat(l.AguinaldoProporcional.toString()),
      Bono14Proporcional:    parseFloat(l.Bono14Proporcional.toString()),
      TotalLiquidacion:      parseFloat(l.TotalLiquidacion.toString()),
      AniosServicio:         parseFloat(l.AniosServicio.toString()),
    }));
  }

  async pagar(id: number) {
    return this.prisma.liquidacionEmpleado.update({
      where: { IdLiquidacion: id },
      data: { Estado: 'PAGADA' },
    });
  }

  async remove(id: number) {
    return this.prisma.liquidacionEmpleado.update({
      where: { IdLiquidacion: id },
      data: { Activo: false, FechaEliminacion: new Date() },
    });
  }

  // ── Helper: meses desde el último pago de bonificación ───────────
  private mesesDesdeUltimoPago(fecha: Date, mesBase: number): number {
    const anio = fecha.getFullYear();
    const mesActual = fecha.getMonth(); // 0-based
    let ultimoPago: Date;

    if (mesActual >= mesBase) {
      ultimoPago = new Date(anio, mesBase, 1);
    } else {
      ultimoPago = new Date(anio - 1, mesBase, 1);
    }

    const diff = fecha.getTime() - ultimoPago.getTime();
    return Math.min(12, Math.max(0, diff / (1000 * 60 * 60 * 24 * 30.44)));
  }
}
