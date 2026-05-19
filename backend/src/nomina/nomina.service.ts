import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { UpdateNominaDto } from './dto/update-nomina.dto';

const FIRMA_INCLUDE = {
  where: { Activo: true },
  include: {
    Usuario: { select: { Username: true } },
  },
};

const NOMINA_INCLUDE = {
  EstadoNomina: true,
  FirmaNomina: FIRMA_INCLUDE,
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
};

function mapDetalles(nomina: any) {
  return {
    ...nomina,
    NominaDetalle: (nomina.NominaDetalle ?? []).map((detalle: any) => ({
      ...detalle,
      SueldoBase: parseFloat(detalle.SueldoBase.toString()),
      BonificacionIncentivo: detalle.BonificacionIncentivo
        ? parseFloat(detalle.BonificacionIncentivo.toString())
        : 0,
      OtrosIngresos: detalle.OtrosIngresos
        ? parseFloat(detalle.OtrosIngresos.toString())
        : 0,
      DescuentoIGSS: detalle.DescuentoIGSS
        ? parseFloat(detalle.DescuentoIGSS.toString())
        : 0,
      DescuentoISR: detalle.DescuentoISR
        ? parseFloat(detalle.DescuentoISR.toString())
        : 0,
      OtrosDescuentos: detalle.OtrosDescuentos
        ? parseFloat(detalle.OtrosDescuentos.toString())
        : 0,
      LiquidoRecibir: detalle.LiquidoRecibir
        ? parseFloat(detalle.LiquidoRecibir.toString())
        : 0,
      DiasLaborados: detalle.DiasLaborados
        ? parseFloat(detalle.DiasLaborados.toString())
        : 0,
    })),
  };
}

@Injectable()
export class NominaService {
  constructor(private prisma: PrismaService) {}

  async create(createNominaDto: CreateNominaDto, usuarioGerenteId?: number) {
    const fechaGeneracion = createNominaDto.FechaGeneracion
      ? new Date(createNominaDto.FechaGeneracion)
      : new Date();

    const data: any = {
      Mes: createNominaDto.Mes,
      Anio: createNominaDto.Anio,
      Quincena: createNominaDto.Quincena,
      FechaGeneracion: fechaGeneracion,
      Estado: createNominaDto.Estado,
      IdUsuarioGerente: createNominaDto.IdUsuarioGerente ?? usuarioGerenteId,
      IdEstadoActual: createNominaDto.IdEstadoActual,
      Activo: createNominaDto.Activo ?? true,
    };

    const nomina = await this.prisma.nominaEncabezado.create({
      data,
      include: NOMINA_INCLUDE,
    });

    return mapDetalles(nomina);
  }

  async findAll() {
    const nominas = await this.prisma.nominaEncabezado.findMany({
      where: { Activo: true },
      include: NOMINA_INCLUDE,
      orderBy: [{ Anio: 'desc' }, { Mes: 'desc' }, { FechaGeneracion: 'desc' }],
    });

    return nominas.map(mapDetalles);
  }

  async findOne(id: number) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id },
      include: NOMINA_INCLUDE,
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${id} no encontrada`);
    }

    return mapDetalles(nomina);
  }

  async update(id: number, updateNominaDto: UpdateNominaDto) {
    const nominaExistente = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id },
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
      IdEstadoActual: updateNominaDto.IdEstadoActual,
      Activo: updateNominaDto.Activo,
    };

    if (updateNominaDto.FechaGeneracion) {
      data.FechaGeneracion = new Date(updateNominaDto.FechaGeneracion);
    }

    const nomina = await this.prisma.nominaEncabezado.update({
      where: { IdNomina: id },
      data,
      include: NOMINA_INCLUDE,
    });

    return mapDetalles(nomina);
  }

  async remove(id: number) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: id },
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
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: idEmpleado, Activo: true },
    });

    if (!empleado) {
      throw new NotFoundException(
        `Empleado con ID ${idEmpleado} no encontrado o inactivo`,
      );
    }

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
      const exceso2 = Math.min(
        Math.max(salarioAnualizado - isrBaseAnual - 141600, 0),
        93400,
      );
      const exceso3 = Math.min(
        Math.max(salarioAnualizado - isrBaseAnual - 235000, 0),
        141000,
      );
      const exceso4 = Math.min(
        Math.max(salarioAnualizado - isrBaseAnual - 376000, 0),
        376000,
      );
      const exceso5 = Math.min(
        Math.max(salarioAnualizado - isrBaseAnual - 752000, 0),
        752000,
      );
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

  async crearNominaConDetalles(
    idEmpleado: number,
    salarioBase: number,
    usuarioGerenteId?: number,
    mes?: number,
    anio?: number,
  ) {
    const empleado = await this.prisma.empleado.findUnique({
      where: { IdEmpleado: idEmpleado, Activo: true },
    });

    if (!empleado) {
      throw new NotFoundException(
        `Empleado con ID ${idEmpleado} no encontrado o inactivo`,
      );
    }

    if (salarioBase <= 0) {
      throw new BadRequestException('El salario base debe ser mayor a cero');
    }

    const ahora = new Date();
    const mesFinal = mes ?? ahora.getMonth() + 1;
    const anioFinal = anio ?? ahora.getFullYear();

    const nominaExistente = await this.prisma.nominaEncabezado.findFirst({
      where: {
        Mes: mesFinal,
        Anio: anioFinal,
        Activo: true,
        NominaDetalle: { some: { IdEmpleado: idEmpleado, Activo: true } },
      },
    });

    if (nominaExistente) {
      throw new BadRequestException(
        `Ya existe una nómina para el empleado en ${mesFinal}/${anioFinal}`,
      );
    }

    const detalles = await this.calcularNomina(idEmpleado, salarioBase);
    const estadoGeneradaId = await this.getEstadoGeneradoId();
    const diasLaborados = await this.getDiasLaborados(idEmpleado, mesFinal, anioFinal);

    const nomina = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: mesFinal,
        Anio: anioFinal,
        FechaGeneracion: ahora,
        Estado: 'GENERADA',
        IdEstadoActual: estadoGeneradaId ?? undefined,
        IdUsuarioGerente: usuarioGerenteId ?? undefined,
        Activo: true,
        NominaDetalle: {
          create: {
            IdEmpleado: idEmpleado,
            DiasLaborados: diasLaborados,
            SueldoBase: detalles.salarioBase,
            BonificacionIncentivo:
              detalles.bono14 + detalles.aguinaldo + detalles.bonoProductividad,
            OtrosIngresos: 0,
            DescuentoIGSS: detalles.descuentoIGSS,
            DescuentoISR: detalles.descuentoISR,
            OtrosDescuentos:
              detalles.descuentoIRTRA + detalles.descuentoINTECAP,
            LiquidoRecibir: detalles.netoAPagar,
            Activo: true,
          },
        },
      },
      include: NOMINA_INCLUDE,
    });

    return mapDetalles(nomina);
  }

  async generarNominaMasiva(usuarioGerenteId?: number, mes?: number, anio?: number) {
    const ahora = new Date();
    const mesFinal = mes ?? ahora.getMonth() + 1;
    const anioFinal = anio ?? ahora.getFullYear();

    const nominaExistente = await this.prisma.nominaEncabezado.findFirst({
      where: { Mes: mesFinal, Anio: anioFinal, Activo: true },
    });

    if (nominaExistente) {
      throw new BadRequestException(
        `Ya existe una nómina generada para ${mesFinal}/${anioFinal}`,
      );
    }

    const empleados = await this.prisma.empleado.findMany({
      where: { Activo: true },
      include: {
        Salario: {
          where: {
            Activo: true,
            OR: [
              { FechaFinVigencia: null },
              { FechaFinVigencia: { gte: ahora } },
            ],
          },
          orderBy: { FechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
    });

    if (empleados.length === 0) {
      throw new BadRequestException(
        'No hay empleados activos para generar nómina',
      );
    }

    const empleadosSinSalario = empleados.filter(
      (emp) => emp.Salario.length === 0,
    );
    if (empleadosSinSalario.length > 0) {
      const nombres = empleadosSinSalario
        .map((emp) => `${emp.Nombres} ${emp.Apellidos}`)
        .join(', ');
      throw new BadRequestException(
        `Los siguientes empleados no tienen salario configurado: ${nombres}`,
      );
    }

    const estadoGeneradaId = await this.getEstadoGeneradoId();
    const nominaEncabezado = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: mesFinal,
        Anio: anioFinal,
        FechaGeneracion: ahora,
        Estado: 'GENERADA',
        IdEstadoActual: estadoGeneradaId ?? undefined,
        Activo: true,
        IdUsuarioGerente: usuarioGerenteId ?? undefined,
      },
    });

    const detallesPromises = empleados.map(async (empleado) => {
      const salarioBase = parseFloat(
        empleado.Salario[0].SalarioBase.toString(),
      );
      const calculo = await this.calcularNomina(empleado.IdEmpleado, salarioBase);
      const diasLaborados = await this.getDiasLaborados(
        empleado.IdEmpleado,
        mesFinal,
        anioFinal,
      );

      return this.prisma.nominaDetalle.create({
        data: {
          IdNomina: nominaEncabezado.IdNomina,
          IdEmpleado: empleado.IdEmpleado,
          DiasLaborados: diasLaborados,
          SueldoBase: calculo.salarioBase,
          BonificacionIncentivo:
            calculo.bono14 + calculo.aguinaldo + calculo.bonoProductividad,
          OtrosIngresos: 0,
          DescuentoIGSS: calculo.descuentoIGSS,
          DescuentoISR: calculo.descuentoISR,
          OtrosDescuentos: calculo.descuentoIRTRA + calculo.descuentoINTECAP,
          LiquidoRecibir: calculo.netoAPagar,
          Activo: true,
        },
        include: {
          Empleado: {
            select: { Nombres: true, Apellidos: true, DPI: true, NIT: true },
          },
        },
      });
    });

    const detalles = await Promise.all(detallesPromises);

    return {
      idNomina: nominaEncabezado.IdNomina,
      mes: mesFinal,
      anio: anioFinal,
      fechaGeneracion: nominaEncabezado.FechaGeneracion,
      totalEmpleados: empleados.length,
      detalles: detalles.map((detalle) => ({
        idEmpleado: detalle.IdEmpleado,
        empleado: `${detalle.Empleado.Nombres} ${detalle.Empleado.Apellidos}`,
        liquidoRecibir: parseFloat(detalle.LiquidoRecibir!.toString()),
      })),
    };
  }

  // ─── Sistema de doble firma ───────────────────────────────────────────────

  async firmarNomina(
    idNomina: number,
    tipoFirmante: string,
    idUsuario: number,
    comentarios?: string,
  ) {
    const tiposValidos = ['JEFE_AREA', 'ENCARGADO'];
    if (!tiposValidos.includes(tipoFirmante)) {
      throw new BadRequestException(
        `Tipo de firmante inválido. Debe ser: ${tiposValidos.join(' o ')}`,
      );
    }

    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: idNomina, Activo: true },
      include: { EstadoNomina: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${idNomina} no encontrada`);
    }

    const estadoActual = nomina.EstadoNomina?.NombreEstado;
    if (estadoActual !== 'PENDIENTE_APROBACION') {
      throw new BadRequestException(
        `La nómina debe estar en estado PENDIENTE_APROBACION para ser firmada. Estado actual: ${estadoActual ?? 'sin estado'}`,
      );
    }

    const firmaExistente = await this.prisma.firmaNomina.findFirst({
      where: { IdNomina: idNomina, TipoFirmante: tipoFirmante, Activo: true },
    });

    if (firmaExistente) {
      throw new BadRequestException(
        `Ya existe una firma de tipo ${tipoFirmante === 'JEFE_AREA' ? 'Jefe de Área' : 'Encargado'} para esta nómina`,
      );
    }

    const firma = await this.prisma.firmaNomina.create({
      data: {
        IdNomina: idNomina,
        TipoFirmante: tipoFirmante,
        IdUsuario: idUsuario,
        FechaFirma: new Date(),
        Comentarios: comentarios,
        Activo: true,
      },
      include: {
        Usuario: { select: { Username: true } },
      },
    });

    // Verificar si ya están ambas firmas → aprobar automáticamente
    const todasFirmas = await this.prisma.firmaNomina.findMany({
      where: { IdNomina: idNomina, Activo: true },
    });

    const tieneJefeArea = todasFirmas.some((f) => f.TipoFirmante === 'JEFE_AREA');
    const tieneEncargado = todasFirmas.some((f) => f.TipoFirmante === 'ENCARGADO');

    let autoAprobada = false;

    if (tieneJefeArea && tieneEncargado) {
      const estadoAprobada = await this.prisma.estadoNomina.findUnique({
        where: { NombreEstado: 'APROBADA' },
      });

      if (estadoAprobada) {
        await this.prisma.nominaEncabezado.update({
          where: { IdNomina: idNomina },
          data: {
            IdEstadoActual: estadoAprobada.IdEstadoNomina,
            Estado: 'APROBADA',
          },
        });

        if (nomina.IdEstadoActual) {
          await this.prisma.historialEstadoNomina.create({
            data: {
              IdNomina: idNomina,
              IdEstadoAnterior: nomina.IdEstadoActual,
              IdEstadoNuevo: estadoAprobada.IdEstadoNomina,
              IdUsuarioCambio: idUsuario,
              FechaCambio: new Date(),
              Comentarios:
                'Nómina aprobada automáticamente — ambas firmas requeridas completadas',
              Activo: true,
            },
          });
        }

        autoAprobada = true;
      }
    }

    return { firma, autoAprobada, firmasRegistradas: todasFirmas.length };
  }

  async getFirmas(idNomina: number) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: idNomina },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${idNomina} no encontrada`);
    }

    return this.prisma.firmaNomina.findMany({
      where: { IdNomina: idNomina, Activo: true },
      include: {
        Usuario: { select: { Username: true } },
      },
      orderBy: { FechaFirma: 'asc' },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getEstadoGeneradoId(): Promise<number | null> {
    const estado = await this.prisma.estadoNomina.findUnique({
      where: { NombreEstado: 'GENERADA' },
    });
    return estado?.IdEstadoNomina ?? null;
  }

  private async getDiasLaborados(
    idEmpleado: number,
    mes: number,
    anio: number,
  ): Promise<number> {
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0, 23, 59, 59, 999);

    const asistencias = await this.prisma.asistencia.findMany({
      where: {
        IdEmpleado: idEmpleado,
        Activo: true,
        Fecha: { gte: inicioMes, lte: finMes },
      },
    });

    const diasUnicos = new Set(
      asistencias.map((a) => a.Fecha.toISOString().slice(0, 10)),
    );

    return diasUnicos.size;
  }

  async getParametros() {
    const parametros = await this.prisma.parametroGlobal.findMany({
      where: { Activo: true },
    });

    if (parametros.length === 0) {
      throw new BadRequestException(
        'No hay parámetros globales configurados en el sistema',
      );
    }

    return parametros.map((param) => ({
      nombre: param.NombreParametro,
      valor: param.Valor,
      tipo: typeof param.Valor,
    }));
  }
}
