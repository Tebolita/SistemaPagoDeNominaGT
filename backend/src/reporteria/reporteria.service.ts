import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ReporteriaService {
  constructor(private prisma: PrismaService) {}

  // ========== REPORTES DE EMPLEADOS ==========
  
  async getReporteEmpleados(fechaInicio?: string, fechaFin?: string) {
    const where: Prisma.EmpleadoWhereInput = {
      Activo: true,
    };

    if (fechaInicio && fechaFin) {
      where.FechaIngresa = {
        gte: new Date(fechaInicio),
        lte: new Date(new Date(fechaFin).setHours(23, 59, 59, 999)), // Incluye todo el día final
      };
    }

    const empleados = await this.prisma.empleado.findMany({
      where,
      include: {
        Puesto: {
          include: { Departamento: true }
        },
        JornadaLaboral: true,
        Banco: true,
        Salario: {
          where: { Activo: true },
          orderBy: { FechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
      orderBy: { Nombres: 'asc' },
    });

    return empleados.map((emp) => ({
      IdEmpleado: emp.IdEmpleado,
      DPI: emp.DPI,
      Nombres: emp.Nombres,
      Apellidos: emp.Apellidos,
      CorreoPersonal: emp.CorreoPersonal,
      Telefono: emp.Telefono,
      FechaIngresa: emp.FechaIngresa,
      Puesto: emp.Puesto?.NombrePuesto || 'No asignado',
      Departamento: emp.Puesto?.Departamento?.NombreDepartamento || 'No asignado',
      JornadaLaboral: emp.JornadaLaboral?.NombreJornada,
      Banco: emp.Banco?.NombreBanco,
      CuentaBancaria: emp.CuentaBancaria,
      SalarioActual: Number(emp.Salario[0]?.SalarioBase || 0),
    }));
  }

  async getReporteSalarios() {
    const salarios = await this.prisma.salario.findMany({
      where: { Activo: true },
      include: {
        Empleado: {
          include: {
            Puesto: {
              include: { Departamento: true }
            },
          },
        },
      },
      orderBy: { SalarioBase: 'desc' },
    });

    return salarios.map((s) => ({
      IdHistorico: s.IdHistorico,
      IdEmpleado: s.IdEmpleado,
      NombreEmpleado: `${s.Empleado.Nombres} ${s.Empleado.Apellidos}`,
      DPI: s.Empleado.DPI,
      Puesto: s.Empleado.Puesto?.NombrePuesto,
      Departamento: s.Empleado.Puesto?.Departamento?.NombreDepartamento,
      SalarioBase: Number(s.SalarioBase),
      FechaInicioVigencia: s.FechaInicioVigencia,
      FechaFinVigencia: s.FechaFinVigencia,
    }));
  }

  async getReporteDepartamentos() {
    const departamentos = await this.prisma.departamento.findMany({
      where: { Activo: true },
      include: {
        Puesto: {
          where: { Activo: true },
          include: {
            Empleado: {
              where: { Activo: true },
              include: {
                Salario: {
                  where: { Activo: true },
                  take: 1,
                  orderBy: { FechaInicioVigencia: 'desc' }
                },
              },
            },
          },
        },
      },
    });

    return departamentos.map((dept) => {
      let totalEmp = 0;
      let totalMasa = 0;

      // Un solo recorrido para calcular ambos totales mejora el rendimiento
      dept.Puesto.forEach(p => {
        totalEmp += p.Empleado.length;
        p.Empleado.forEach(e => {
          totalMasa += Number(e.Salario[0]?.SalarioBase || 0);
        });
      });

      return {
        IdDepartamento: dept.IdDepartamento,
        NombreDepartamento: dept.NombreDepartamento,
        CantidadPuestos: dept.Puesto.length,
        CantidadEmpleados: totalEmp,
        MasaSalarial: totalMasa,
      };
    });
  }

  // ========== REPORTES DE NÓMINA ==========

  async getReporteNomina(mes?: number, anio?: number) {
    const where: Prisma.NominaEncabezadoWhereInput = {};
    if (mes && anio) {
      where.Mes = mes;
      where.Anio = anio;
    }

    const nominas = await this.prisma.nominaEncabezado.findMany({
      where,
      include: {
        NominaDetalle: {
          include: {
            Empleado: {
              include: {
                Puesto: true,
                Departamento: true,
              },
            },
          },
        },
        EstadoNomina: true,
      },
      orderBy: { FechaGeneracion: 'desc' },
    });

    return nominas.map((n) => {
      // Calculamos totales en un solo paso para evitar múltiples reduces
      const totales = n.NominaDetalle.reduce((acc, d) => ({
        sueldos: acc.sueldos + Number(d.SueldoBase || 0),
        bonos: acc.bonos + Number(d.BonificacionIncentivo || 0),
        descuentos: acc.descuentos + 
          Number(d.DescuentoIGSS || 0) + 
          Number(d.DescuentoISR || 0) + 
          Number(d.OtrosDescuentos || 0),
        liquido: acc.liquido + Number(d.LiquidoRecibir || 0)
      }), { sueldos: 0, bonos: 0, descuentos: 0, liquido: 0 });

      return {
        IdNomina: n.IdNomina,
        Mes: n.Mes,
        Anio: n.Anio,
        Quincena: n.Quincena,
        FechaGeneracion: n.FechaGeneracion,
        Estado: n.EstadoNomina?.NombreEstado,
        TotalEmpleados: n.NominaDetalle.length,
        TotalSueldos: totales.sueldos,
        TotalBonificaciones: totales.bonos,
        TotalDescuentos: totales.descuentos,
        TotalLiquido: totales.liquido,
        Detalle: n.NominaDetalle.map((d) => ({
          IdEmpleado: d.IdEmpleado,
          NombreEmpleado: `${d.Empleado.Nombres} ${d.Empleado.Apellidos}`,
          Puesto: d.Empleado.Puesto?.NombrePuesto,
          DiasLaborados: d.DiasLaborados,
          SueldoBase: Number(d.SueldoBase),
          BonificacionIncentivo: Number(d.BonificacionIncentivo || 0),
          OtrosIngresos: Number(d.OtrosIngresos || 0),
          DescuentoIGSS: Number(d.DescuentoIGSS || 0),
          DescuentoISR: Number(d.DescuentoISR || 0),
          OtrosDescuentos: Number(d.OtrosDescuentos || 0),
          LiquidoRecibir: Number(d.LiquidoRecibir || 0),
        })),
      };
    });
  }

  // ========== REPORTES DE ASISTENCIA ==========

  async getReporteAsistencias(fechaInicio: string, fechaFin: string) {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    end.setHours(23, 59, 59, 999);

    const empleados = await this.prisma.empleado.findMany({
      where: { Activo: true },
      include: {
        Asistencia: {
          where: {
            Fecha: { gte: start, lte: end },
          },
        },
        Puesto: {
          include: { Departamento: true }
        },
      },
    });

    return empleados.map((emp) => {
      const stats = emp.Asistencia.reduce((acc, a) => ({
        entradas: acc.entradas + (a.HoraEntrada ? 1 : 0),
        salidas: acc.salidas + (a.HoraSalida ? 1 : 0),
        extras: acc.extras + Number(a.HorasExtra || 0)
      }), { entradas: 0, salidas: 0, extras: 0 });

      return {
        IdEmpleado: emp.IdEmpleado,
        NombreEmpleado: `${emp.Nombres} ${emp.Apellidos}`,
        Puesto: emp.Puesto?.NombrePuesto,
        Departamento: emp.Puesto?.Departamento?.NombreDepartamento,
        TotalAsistencias: emp.Asistencia.length,
        DiasConEntrada: stats.entradas,
        DiasConSalida: stats.salidas,
        TotalHorasExtra: stats.extras,
      };
    });
  }

  // ========== REPORTES DE VACACIONES ==========

  async getReporteVacaciones(anio?: number) {
    const where: Prisma.ControlVacacionWhereInput = { Activo: true };
    if (anio) {
      where.AnioCorriente = anio;
    }

    const vacaciones = await this.prisma.controlVacacion.findMany({
      where,
      include: {
        Empleado: {
          include: {
            Puesto: {
              include: { Departamento: true }
            },
          },
        },
        DetalleControlVacacion: {
          include: {
            Incidencia: true,
          },
        },
      },
    });

    return vacaciones.map((v) => ({
      IdControlVacacion: v.IdControlVacacion,
      IdEmpleado: v.IdEmpleado,
      NombreEmpleado: `${v.Empleado.Nombres} ${v.Empleado.Apellidos}`,
      Puesto: v.Empleado.Puesto?.NombrePuesto,
      Departamento: v.Empleado.Puesto?.Departamento?.NombreDepartamento,
      Anio: v.AnioCorriente,
      DiasGanados: v.DiasGanados,
      DiasGozados: v.DiasGozados,
      DiasPendientes: (v.DiasGanados || 0) - Number(v.DiasGozados || 0),
      Detalles: v.DetalleControlVacacion.map((d) => ({
        IdIncidencia: d.IdIncidencia,
        TipoIncidencia: d.Incidencia?.TipoIncidencia,
        DiasDescontados: d.DiasDescontados,
        FechaRegistro: d.FechaRegistro,
      })),
    }));
  }

  // ========== RESUMEN EJECUTIVO ==========

  async getResumenEjecutivo() {
    // Ejecutamos promesas en paralelo para mayor velocidad
    const [
      totalEmpleados,
      empleadosConSalario,
      ultimaNomina,
      totalVacaciones,
      departamentos,
      puestos
    ] = await Promise.all([
      this.prisma.empleado.count({ where: { Activo: true } }),
      this.prisma.salario.count({ where: { Activo: true } }),
      this.prisma.nominaEncabezado.findFirst({
        orderBy: { FechaGeneracion: 'desc' },
        include: { NominaDetalle: true },
      }),
      this.prisma.controlVacacion.count({ where: { Activo: true } }),
      this.prisma.departamento.count({ where: { Activo: true } }),
      this.prisma.puesto.count({ where: { Activo: true } }),
    ]);

    return {
      totalEmpleados,
      empleadosConSalario,
      ultimaNomina: ultimaNomina
        ? {
            IdNomina: ultimaNomina.IdNomina,
            Mes: ultimaNomina.Mes,
            Anio: ultimaNomina.Anio,
            TotalEmpleados: ultimaNomina.NominaDetalle.length,
            TotalLiquido: ultimaNomina.NominaDetalle.reduce(
              (acc, d) => acc + Number(d.LiquidoRecibir || 0),
              0,
            ),
          }
        : null,
      totalVacaciones,
      totalDepartamentos: departamentos,
      totalPuestos: puestos,
    };
  }
}