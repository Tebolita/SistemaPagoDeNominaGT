import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { UpdateNominaDto } from './dto/update-nomina.dto';

@Injectable()
export class NominaService {
  constructor(private prisma: PrismaService) {}

  async create(createNominaDto: CreateNominaDto) {
    const nomina = await this.prisma.nominaEncabezado.create({
      data: {
        IdEmpleado: createNominaDto.IdEmpleado,
        FechaProceso: new Date(createNominaDto.FechaProceso),
        SalarioBase: createNominaDto.SalarioBase,
        Activo: true,
      },
      include: {
        NominaDetalle: true,
        Empleado: true,
      },
    });

    return nomina;
  }

  async findAll() {
    return await this.prisma.nominaEncabezado.findMany({
      where: { Activo: true },
      include: {
        Empleado: {
          select: {
            NombreCompleto: true,
            NumeroIdentificacion: true,
            Usuario: {
              select: {
                Correo: true,
              },
            },
          },
        },
        NominaDetalle: true,
      },
      orderBy: { FechaProceso: 'desc' },
    });
  }

  async findOne(id: number) {
    return await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id },
      include: {
        Empleado: {
          select: {
            NombreCompleto: true,
            NumeroIdentificacion: true,
            Puesto: {
              select: { NombrePuesto: true },
            },
            Usuario: {
              select: {
                Correo: true,
              },
            },
          },
        },
        NominaDetalle: true,
      },
    });
  }

  async update(id: number, updateNominaDto: UpdateNominaDto) {
    return await this.prisma.nominaEncabezado.update({
      where: { IdNomina: id },
      data: {
        SalarioBase: updateNominaDto.SalarioBase,
      },
      include: {
        NominaDetalle: true,
        Empleado: true,
      },
    });
  }

  async remove(id: number) {
    return await this.prisma.nominaEncabezado.update({
      where: { IdNomina: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }

  async calcularNomina(idEmpleado: number, salarioBase: number) {
    // Obtener parámetros globales
    const parametros = await this.prisma.parametroGlobal.findMany({
      where: { Activo: true },
    });

    const getParam = (nombre: string): number => {
      const param = parametros.find((p) => p.NombreParametro === nombre);
      return param ? parseFloat(param.Valor.toString()) : 0;
    };

    // Parámetros
    const igssEmpleado = getParam('IGSS_EMPLEADO') / 100;
    const isrTasa1 = getParam('ISR_TASA_1') / 100;
    const isrTasa2 = getParam('ISR_TASA_2') / 100;
    const isrTasa3 = getParam('ISR_TASA_3') / 100;
    const isrTasa4 = getParam('ISR_TASA_4') / 100;
    const isrTasa5 = getParam('ISR_TASA_5') / 100;
    const isrTasa6 = getParam('ISR_TASA_6') / 100;
    const isrBaseAnual = getParam('ISR_BASE_ANUAL');
    const bono14Porcentaje = getParam('BONO_14_PORCENTAJE') / 100;
    const aguinaldoPorcentaje = getParam('AGUINALDO_PORCENTAJE') / 100;
    const bonoProd = getParam('BONO_PRODUCTIVIDAD');
    const irtra = getParam('IRTRA_PORCENTAJE') / 100;
    const intecap = getParam('INTECAP_PORCENTAJE') / 100;

    // Cálculos
    const salarioMensual = salarioBase;

    // Descuentos
    const descuentoIGSS = salarioMensual * igssEmpleado;

    // ISR mensual simplificado
    const salarioAnualizado = salarioMensual * 12;
    let isr = 0;
    if (salarioAnualizado > isrBaseAnual) {
      const exceso1 = Math.min(salarioAnualizado - isrBaseAnual, 141600);
      const exceso2 = Math.min(Math.max(salarioAnualizado - isrBaseAnual - 141600, 0), 93400);
      const exceso3 = Math.min(Math.max(salarioAnualizado - isrBaseAnual - 235000, 0), 141000);
      const exceso4 = Math.min(Math.max(salarioAnualizado - isrBaseAnual - 376000, 0), 376000);
      const exceso5 = Math.min(Math.max(salarioAnualizado - isrBaseAnual - 752000, 0), 752000);
      const exceso6 = Math.max(salarioAnualizado - isrBaseAnual - 1504000, 0);

      isr =
        exceso1 * isrTasa1 +
        exceso2 * isrTasa2 +
        exceso3 * isrTasa3 +
        exceso4 * isrTasa4 +
        exceso5 * isrTasa5 +
        exceso6 * isrTasa6;

      isr = isr / 12; // Dividir por 12 meses
    }

    // Otros descuentos
    const descuentoIRTRA = salarioMensual * irtra;
    const descuentoINTECAP = salarioMensual * intecap;

    const totalDescuentos =
      descuentoIGSS + isr + descuentoIRTRA + descuentoINTECAP;

    // Ingresos adicionales
    const bono14 = salarioMensual * bono14Porcentaje;
    const aguinaldo = salarioMensual * aguinaldoPorcentaje;

    const totalIngresos = salarioMensual + bono14 + aguinaldo + bonoProd;

    // Neto
    const netoAPagar = totalIngresos - totalDescuentos;

    return {
      salarioBase: salarioMensual,
      bono14: Number(bono14.toFixed(2)),
      aguinaldo: Number(aguinaldo.toFixed(2)),
      bonoProductividad: Number(bonoProd.toFixed(2)),
      totalIngresos: Number(totalIngresos.toFixed(2)),
      descuentoIGSS: Number(descuentoIGSS.toFixed(2)),
      descuentoISR: Number(isr.toFixed(2)),
      descuentoIRTRA: Number(descuentoIRTRA.toFixed(2)),
      descuentoINTECAP: Number(descuentoINTECAP.toFixed(2)),
      totalDescuentos: Number(totalDescuentos.toFixed(2)),
      netoAPagar: Number(netoAPagar.toFixed(2)),
    };
  }

  async crearNominaConDetalles(idEmpleado: number, salarioBase: number) {
    const detalles = await this.calcularNomina(idEmpleado, salarioBase);

    const nomina = await this.prisma.nominaEncabezado.create({
      data: {
        IdEmpleado,
        FechaProceso: new Date(),
        SalarioBase: salarioBase,
        Activo: true,
        NominaDetalle: {
          create: {
            ConceptoDescripcion: 'Nómina Mensual',
            SalarioBase: detalles.salarioBase,
            Bono14: detalles.bono14,
            Aguinaldo: detalles.aguinaldo,
            BonoProductividad: detalles.bonoProductividad,
            TotalIngresos: detalles.totalIngresos,
            DescuentoIGSS: detalles.descuentoIGSS,
            DescuentoISR: detalles.descuentoISR,
            DescuentoIRTRA: detalles.descuentoIRTRA,
            DescuentoINTECAP: detalles.descuentoINTECAP,
            TotalDescuentos: detalles.totalDescuentos,
            NetoAPagar: detalles.netoAPagar,
          },
        },
      },
      include: {
        NominaDetalle: true,
        Empleado: true,
      },
    });

    return nomina;
  }
}
