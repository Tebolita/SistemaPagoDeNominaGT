import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { UpdateNominaDto } from './dto/update-nomina.dto';

@Injectable()
export class NominaService {
  constructor(private prisma: PrismaService) {}

  async create(createNominaDto: CreateNominaDto) {
    const fechaGeneracion = createNominaDto.FechaGeneracion
      ? new Date(createNominaDto.FechaGeneracion)
      : new Date();

    const nomina = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: createNominaDto.Mes,
        Anio: createNominaDto.Anio,
        Quincena: createNominaDto.Quincena,
        FechaGeneracion: fechaGeneracion,
        Estado: createNominaDto.Estado,
        IdUsuarioGerente: createNominaDto.IdUsuarioGerente,
        Activo: createNominaDto.Activo ?? true,
      },
      include: {
        NominaDetalle: {
          include: {
            Empleado: {
              select: {
                Nombres: true,
                Apellidos: true,
                DPI: true,
                NIT: true,
              },
            },
          },
        },
      },
    });

    // Convertir valores decimales de strings a números
    return {
      ...nomina,
      NominaDetalle: nomina.NominaDetalle.map(detalle => ({
        ...detalle,
        SueldoBase: parseFloat(detalle.SueldoBase.toString()),
        BonificacionIncentivo: detalle.BonificacionIncentivo ? parseFloat(detalle.BonificacionIncentivo.toString()) : 0,
        OtrosIngresos: detalle.OtrosIngresos ? parseFloat(detalle.OtrosIngresos.toString()) : 0,
        DescuentoIGSS: detalle.DescuentoIGSS ? parseFloat(detalle.DescuentoIGSS.toString()) : 0,
        DescuentoISR: detalle.DescuentoISR ? parseFloat(detalle.DescuentoISR.toString()) : 0,
        OtrosDescuentos: detalle.OtrosDescuentos ? parseFloat(detalle.OtrosDescuentos.toString()) : 0,
        LiquidoRecibir: detalle.LiquidoRecibir ? parseFloat(detalle.LiquidoRecibir.toString()) : 0,
        DiasLaborados: detalle.DiasLaborados ? parseFloat(detalle.DiasLaborados.toString()) : 0,
      })),
    };
  }

  async findAll() {
    const nominas = await this.prisma.nominaEncabezado.findMany({
      where: { Activo: true },
      include: {
        NominaDetalle: {
          include: {
            Empleado: {
              select: {
                Nombres: true,
                Apellidos: true,
                DPI: true,
                NIT: true,
              },
            },
          },
        },
      },
      orderBy: { FechaGeneracion: 'desc' },
    });

    // Convertir valores decimales de strings a números
    return nominas.map(nomina => ({
      ...nomina,
      NominaDetalle: nomina.NominaDetalle.map(detalle => ({
        ...detalle,
        SueldoBase: parseFloat(detalle.SueldoBase.toString()),
        BonificacionIncentivo: detalle.BonificacionIncentivo ? parseFloat(detalle.BonificacionIncentivo.toString()) : 0,
        OtrosIngresos: detalle.OtrosIngresos ? parseFloat(detalle.OtrosIngresos.toString()) : 0,
        DescuentoIGSS: detalle.DescuentoIGSS ? parseFloat(detalle.DescuentoIGSS.toString()) : 0,
        DescuentoISR: detalle.DescuentoISR ? parseFloat(detalle.DescuentoISR.toString()) : 0,
        OtrosDescuentos: detalle.OtrosDescuentos ? parseFloat(detalle.OtrosDescuentos.toString()) : 0,
        LiquidoRecibir: detalle.LiquidoRecibir ? parseFloat(detalle.LiquidoRecibir.toString()) : 0,
        DiasLaborados: detalle.DiasLaborados ? parseFloat(detalle.DiasLaborados.toString()) : 0,
      })),
    }));
  }

  async findOne(id: number) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id },
      include: {
        NominaDetalle: {
          include: {
            Empleado: {
              select: {
                Nombres: true,
                Apellidos: true,
                DPI: true,
                NIT: true,
              },
            },
          },
        },
      },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${id} no encontrada`);
    }

    // Convertir valores decimales de strings a números
    return {
      ...nomina,
      NominaDetalle: nomina.NominaDetalle.map(detalle => ({
        ...detalle,
        SueldoBase: parseFloat(detalle.SueldoBase.toString()),
        BonificacionIncentivo: detalle.BonificacionIncentivo ? parseFloat(detalle.BonificacionIncentivo.toString()) : 0,
        OtrosIngresos: detalle.OtrosIngresos ? parseFloat(detalle.OtrosIngresos.toString()) : 0,
        DescuentoIGSS: detalle.DescuentoIGSS ? parseFloat(detalle.DescuentoIGSS.toString()) : 0,
        DescuentoISR: detalle.DescuentoISR ? parseFloat(detalle.DescuentoISR.toString()) : 0,
        OtrosDescuentos: detalle.OtrosDescuentos ? parseFloat(detalle.OtrosDescuentos.toString()) : 0,
        LiquidoRecibir: detalle.LiquidoRecibir ? parseFloat(detalle.LiquidoRecibir.toString()) : 0,
        DiasLaborados: detalle.DiasLaborados ? parseFloat(detalle.DiasLaborados.toString()) : 0,
      })),
    };
  }

  async update(id: number, updateNominaDto: UpdateNominaDto) {
    // Verificar que la nómina existe
    const nominaExistente = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id }
    });

    if (!nominaExistente) {
      throw new NotFoundException(`Nómina con ID ${id} no encontrada`);
    }

    const data: any = {
      Mes: updateNominaDto.Mes,
      Anio: updateNominaDto.Anio,
      Quincena: updateNominaDto.Quincena,
      Estado: updateNominaDto.Estado,
      IdUsuarioGerente: updateNominaDto.IdUsuarioGerente,
      Activo: updateNominaDto.Activo,
    };

    if (updateNominaDto.FechaGeneracion) {
      data.FechaGeneracion = new Date(updateNominaDto.FechaGeneracion);
    }

    const nomina = await this.prisma.nominaEncabezado.update({
      where: { IdNomina: id },
      data,
      include: {
        NominaDetalle: {
          include: {
            Empleado: true,
          },
        },
      },
    });

    // Convertir valores decimales de strings a números
    return {
      ...nomina,
      NominaDetalle: nomina.NominaDetalle.map(detalle => ({
        ...detalle,
        SueldoBase: parseFloat(detalle.SueldoBase.toString()),
        BonificacionIncentivo: detalle.BonificacionIncentivo ? parseFloat(detalle.BonificacionIncentivo.toString()) : 0,
        OtrosIngresos: detalle.OtrosIngresos ? parseFloat(detalle.OtrosIngresos.toString()) : 0,
        DescuentoIGSS: detalle.DescuentoIGSS ? parseFloat(detalle.DescuentoIGSS.toString()) : 0,
        DescuentoISR: detalle.DescuentoISR ? parseFloat(detalle.DescuentoISR.toString()) : 0,
        OtrosDescuentos: detalle.OtrosDescuentos ? parseFloat(detalle.OtrosDescuentos.toString()) : 0,
        LiquidoRecibir: detalle.LiquidoRecibir ? parseFloat(detalle.LiquidoRecibir.toString()) : 0,
        DiasLaborados: detalle.DiasLaborados ? parseFloat(detalle.DiasLaborados.toString()) : 0,
      })),
    };
  }

  async remove(id: number) {
    // Verificar que la nómina existe
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id }
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${id} no encontrada`);
    }

    if (!nomina.Activo) {
      throw new BadRequestException(`La nómina con ID ${id} ya está eliminada`);
    }

    return await this.prisma.nominaEncabezado.update({
      where: { IdNomina: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }

  async calcularNomina(idEmpleado: number, salarioBase: number) {
    // Validar que el empleado existe
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: idEmpleado, Activo: true }
    });

    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${idEmpleado} no encontrado o inactivo`);
    }

    // Validar salario base
    if (salarioBase <= 0) {
      throw new BadRequestException('El salario base debe ser mayor a cero');
    }

    const parametros = await this.prisma.parametroGlobal.findMany({
      where: { Activo: true },
    });

    const getParam = (nombre: string): number => {
      const param = parametros.find((p) => p.NombreParametro === nombre);
      return param ? parseFloat(param.Valor.toString()) : 0;
    };

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

    const salarioMensual = salarioBase;
    const descuentoIGSS = salarioMensual * igssEmpleado;
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

      isr = isr / 12;
    }

    const descuentoIRTRA = salarioMensual * irtra;
    const descuentoINTECAP = salarioMensual * intecap;
    const totalDescuentos =
      descuentoIGSS + isr + descuentoIRTRA + descuentoINTECAP;
    const bono14 = salarioMensual * bono14Porcentaje;
    const aguinaldo = salarioMensual * aguinaldoPorcentaje;
    const totalIngresos = salarioMensual + bono14 + aguinaldo + bonoProd;
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
    // Validar que el empleado existe
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: idEmpleado, Activo: true }
    });

    if (!empleado) {
      throw new NotFoundException(`Empleado con ID ${idEmpleado} no encontrado o inactivo`);
    }

    // Validar salario base
    if (salarioBase <= 0) {
      throw new BadRequestException('El salario base debe ser mayor a cero');
    }

    const detalles = await this.calcularNomina(idEmpleado, salarioBase);
    const fechaGeneracion = new Date();
    const ahora = new Date();

    const nomina = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: ahora.getMonth() + 1,
        Anio: ahora.getFullYear(),
        FechaGeneracion: fechaGeneracion,
        Estado: 'GENERADA',
        Activo: true,
        NominaDetalle: {
          create: {
            IdEmpleado: idEmpleado,
            DiasLaborados: 30,
            SueldoBase: detalles.salarioBase,
            BonificacionIncentivo:
              detalles.bono14 + detalles.aguinaldo + detalles.bonoProductividad,
            OtrosIngresos: 0,
            DescuentoIGSS: detalles.descuentoIGSS,
            DescuentoISR: detalles.descuentoISR,
            OtrosDescuentos: detalles.descuentoIRTRA + detalles.descuentoINTECAP,
            LiquidoRecibir: detalles.netoAPagar,
            Activo: true,
          },
        },
      },
      include: {
        NominaDetalle: {
          include: {
            Empleado: {
              select: {
                Nombres: true,
                Apellidos: true,
                DPI: true,
                NIT: true,
              },
            },
          },
        },
      },
    });

    // Convertir valores decimales de strings a números
    return {
      ...nomina,
      NominaDetalle: nomina.NominaDetalle.map(detalle => ({
        ...detalle,
        SueldoBase: parseFloat(detalle.SueldoBase.toString()),
        BonificacionIncentivo: detalle.BonificacionIncentivo ? parseFloat(detalle.BonificacionIncentivo.toString()) : 0,
        OtrosIngresos: detalle.OtrosIngresos ? parseFloat(detalle.OtrosIngresos.toString()) : 0,
        DescuentoIGSS: detalle.DescuentoIGSS ? parseFloat(detalle.DescuentoIGSS.toString()) : 0,
        DescuentoISR: detalle.DescuentoISR ? parseFloat(detalle.DescuentoISR.toString()) : 0,
        OtrosDescuentos: detalle.OtrosDescuentos ? parseFloat(detalle.OtrosDescuentos.toString()) : 0,
        LiquidoRecibir: detalle.LiquidoRecibir ? parseFloat(detalle.LiquidoRecibir.toString()) : 0,
        DiasLaborados: detalle.DiasLaborados ? parseFloat(detalle.DiasLaborados.toString()) : 0,
      })),
    };
  }

  async getParametros() {
    const parametros = await this.prisma.parametroGlobal.findMany({
      where: { Activo: true },
    });

    if (parametros.length === 0) {
      throw new BadRequestException('No hay parámetros globales configurados en el sistema');
    }

    return parametros.map(param => ({
      nombre: param.NombreParametro,
      valor: param.Valor,
      tipo: typeof param.Valor
    }));
  }

  async generarNominaMasiva() {
    const fechaActual = new Date();
    const mes = fechaActual.getMonth() + 1;
    const anio = fechaActual.getFullYear();

    // Verificar si ya existe una nómina para este mes/año
    const nominaExistente = await this.prisma.nominaEncabezado.findFirst({
      where: {
        Mes: mes,
        Anio: anio,
        Activo: true
      }
    });

    if (nominaExistente) {
      throw new BadRequestException(`Ya existe una nómina generada para ${mes}/${anio}`);
    }

    // Obtener empleados activos con sus salarios vigentes
    const empleados = await this.prisma.empleado.findMany({
      where: { Activo: true },
      include: {
        Salario: {
          where: {
            Activo: true,
            OR: [
              { FechaFinVigencia: null },
              { FechaFinVigencia: { gte: fechaActual } }
            ]
          },
          orderBy: { FechaInicioVigencia: 'desc' },
          take: 1
        }
      }
    });

    if (empleados.length === 0) {
      throw new BadRequestException('No hay empleados activos para generar nómina');
    }

    const empleadosSinSalario = empleados.filter(emp => emp.Salario.length === 0);
    if (empleadosSinSalario.length > 0) {
      const nombres = empleadosSinSalario.map(emp => `${emp.Nombres} ${emp.Apellidos}`).join(', ');
      throw new BadRequestException(`Los siguientes empleados no tienen salario configurado: ${nombres}`);
    }

    // Crear encabezado de nómina
    const nominaEncabezado = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: mes,
        Anio: anio,
        FechaGeneracion: fechaActual,
        Estado: 'GENERADA',
        Activo: true,
        // TODO: Asignar IdUsuarioGerente cuando esté disponible en el contexto
        IdUsuarioGerente: 1 // Usuario por defecto, debería venir del JWT
      }
    });

    // Generar detalles de nómina para cada empleado
    const detallesPromises = empleados.map(async (empleado) => {
      const salarioBase = parseFloat(empleado.Salario[0].SalarioBase.toString());
      const calculo = await this.calcularNomina(empleado.IdEmpleado, salarioBase);

      return this.prisma.nominaDetalle.create({
        data: {
          IdNomina: nominaEncabezado.IdNomina,
          IdEmpleado: empleado.IdEmpleado,
          DiasLaborados: 30, // TODO: Calcular basado en asistencias
          SueldoBase: calculo.salarioBase,
          BonificacionIncentivo: calculo.bono14 + calculo.aguinaldo + calculo.bonoProductividad,
          OtrosIngresos: 0,
          DescuentoIGSS: calculo.descuentoIGSS,
          DescuentoISR: calculo.descuentoISR,
          OtrosDescuentos: calculo.descuentoIRTRA + calculo.descuentoINTECAP,
          LiquidoRecibir: calculo.netoAPagar,
          Activo: true,
        },
        include: {
          Empleado: {
            select: {
              Nombres: true,
              Apellidos: true,
              DPI: true,
              NIT: true,
            },
          },
        },
      });
    });

    const detalles = await Promise.all(detallesPromises);

    return {
      idNomina: nominaEncabezado.IdNomina,
      mes: mes,
      anio: anio,
      fechaGeneracion: nominaEncabezado.FechaGeneracion,
      totalEmpleados: empleados.length,
      detalles: detalles.map(detalle => ({
        idEmpleado: detalle.IdEmpleado,
        empleado: `${detalle.Empleado.Nombres} ${detalle.Empleado.Apellidos}`,
        liquidoRecibir: parseFloat(detalle.LiquidoRecibir!.toString())
      }))
    };
  }
}
