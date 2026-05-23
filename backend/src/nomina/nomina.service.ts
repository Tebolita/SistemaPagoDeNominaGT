import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigFirmanteService } from '../config-firmante/config-firmante.service';
import { CorreoService } from '../correo/correo.service';
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
  CuentaBancariaEmpresa: {
    select: { IdCuenta: true, NombreCuenta: true, NumeroCuenta: true, SaldoActual: true, Moneda: true },
  },
  FirmanteAsignadoNomina: {
    where: { Activo: true },
    include: {
      Usuario: {
        select: {
          IdUsuario: true,
          Username: true,
          IdEmpleado: true,
          RolUsuario: { select: { NombreRol: true } },
          Empleado:   { select: { Nombres: true, Apellidos: true, CorreoPersonal: true } },
        },
      },
    },
  },
  NominaDetalle: {
    include: {
      Empleado: {
        select: { Nombres: true, Apellidos: true, DPI: true, NIT: true },
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
  constructor(
    private prisma: PrismaService,
    private configFirmanteService: ConfigFirmanteService,
    private correoService: CorreoService,
  ) {}

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

  async findEliminadas() {
    const nominas = await this.prisma.nominaEncabezado.findMany({
      where: { Activo: false },
      include: NOMINA_INCLUDE,
      orderBy: [{ FechaEliminacion: 'desc' }],
    });
    return nominas.map(mapDetalles);
  }

  async restaurar(id: number) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({ where: { IdNomina: id } });
    if (!nomina) throw new NotFoundException(`Nómina ${id} no encontrada`);
    if (nomina.Activo) throw new BadRequestException('La nómina ya está activa');

    return this.prisma.nominaEncabezado.update({
      where: { IdNomina: id },
      data: { Activo: true, FechaEliminacion: null },
      include: NOMINA_INCLUDE,
    });
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

  // ─── Firmantes asignados por nómina ──────────────────────────────────────

  async getAsignacionesFirmantes(idNomina: number) {
    return this.prisma.firmanteAsignadoNomina.findMany({
      where: { IdNomina: idNomina, Activo: true },
      include: {
        Usuario: {
          select: {
            IdUsuario: true,
            Username: true,
            IdEmpleado: true,
            RolUsuario: { select: { NombreRol: true } },
            Empleado:   { select: { Nombres: true, Apellidos: true, CorreoPersonal: true } },
          },
        },
      },
    });
  }

  async asignarFirmantesNomina(
    idNomina: number,
    asignaciones: {
      TipoFirmante:      string;
      Modo:              string;
      RolRequerido?:     string | null;
      IdUsuarioAsignado?: number | null;
      NotificarCorreo:   boolean;
    }[],
    idUsuarioRegistra?: number,
  ) {
    const nomina = await this.findOne(idNomina);

    // Desactivar asignaciones anteriores
    await this.prisma.firmanteAsignadoNomina.updateMany({
      where: { IdNomina: idNomina, Activo: true },
      data:  { Activo: false },
    });

    // Crear nuevas
    for (const asig of asignaciones) {
      await this.prisma.firmanteAsignadoNomina.create({
        data: {
          IdNomina:          idNomina,
          TipoFirmante:      asig.TipoFirmante,
          Modo:              asig.Modo,
          RolRequerido:      asig.RolRequerido  ?? null,
          IdUsuarioAsignado: asig.IdUsuarioAsignado ?? null,
          NotificarCorreo:   asig.NotificarCorreo,
          Activo:            true,
        },
      });
    }

    // Notificar a usuarios asignados
    const aNotificar = asignaciones.filter(a => a.NotificarCorreo && a.IdUsuarioAsignado);
    if (aNotificar.length) {
      await this.notificarFirmantesAsignados(idNomina, aNotificar.map(a => a.IdUsuarioAsignado!), nomina);
    }

    return this.getAsignacionesFirmantes(idNomina);
  }

  private async notificarFirmantesAsignados(idNomina: number, idsUsuarios: number[], nomina: any) {
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const periodo = `${meses[(nomina.Mes ?? 1) - 1]} ${nomina.Anio}`;

    for (const idUsuario of idsUsuarios) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { IdUsuario: idUsuario },
        include: { Empleado: { select: { CorreoPersonal: true, Nombres: true, Apellidos: true } } },
      });
      if (!usuario?.Empleado?.CorreoPersonal) continue;

      const asig = await this.prisma.firmanteAsignadoNomina.findFirst({
        where: { IdNomina: idNomina, IdUsuarioAsignado: idUsuario, Activo: true },
      });

      await this.correoService.enviarNotificacionFirma(
        usuario.Empleado.CorreoPersonal,
        `${usuario.Empleado.Nombres} ${usuario.Empleado.Apellidos}`,
        asig?.TipoFirmante ?? 'Firmante',
        periodo,
        idNomina,
      );
    }
  }

  // ─── Calcular nómina ──────────────────────────────────────────────────────

  async calcularNomina(idEmpleado: number, salarioBase: number, mes?: number, anio?: number) {
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

    // Devuelve el valor del parámetro solo si el empleado cumple los filtros configurados
    const getParam = (nombre: string): number => {
      const param = parametros.find((p) => p.NombreParametro === nombre);
      if (!param) return 0;
      if (!this.empleadoMatcheFiltro(empleado, param)) return 0;
      return parseFloat(param.Valor.toString());
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
    const horasExtraPct    = getParam('HORAS_EXTRA_PORCENTAJE') / 100;   // e.g. 0.50 → 50%
    const horasLaboralesDia = getParam('HORAS_LABORALES_DIA') || 8;      // default 8 hrs

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
    const totalDescuentos = descuentoIGSS + isr + descuentoIRTRA + descuentoINTECAP;

    const bono14    = salarioMensual * bono14Porcentaje;
    const aguinaldo = salarioMensual * aguinaldoPorcentaje;

    // ── Horas extra (Guatemala: valor/hora × 1.5 × horas trabajadas) ─────
    let horasExtrasTotal = 0;
    let pagoHorasExtras  = 0;
    let valorHoraExtra   = 0;

    if (mes && anio && horasExtraPct > 0) {
      horasExtrasTotal = await this.getHorasExtras(idEmpleado, mes, anio);
      if (horasExtrasTotal > 0) {
        const valorHoraNormal = salarioMensual / 30 / horasLaboralesDia;
        valorHoraExtra  = Number((valorHoraNormal * (1 + horasExtraPct)).toFixed(4));
        pagoHorasExtras = Number((horasExtrasTotal * valorHoraExtra).toFixed(2));
      }
    }

    const totalIngresos = salarioMensual + bono14 + aguinaldo + bonoProd + pagoHorasExtras;
    const netoAPagar    = totalIngresos - totalDescuentos;

    return {
      salarioBase:       salarioMensual,
      bono14:            Number(bono14.toFixed(2)),
      aguinaldo:         Number(aguinaldo.toFixed(2)),
      bonoProductividad: Number(bonoProd.toFixed(2)),
      horasExtras:       horasExtrasTotal,
      valorHoraExtra,
      pagoHorasExtras,
      totalIngresos:     Number(totalIngresos.toFixed(2)),
      descuentoIGSS:     Number(descuentoIGSS.toFixed(2)),
      descuentoISR:      Number(isr.toFixed(2)),
      descuentoIRTRA:    Number(descuentoIRTRA.toFixed(2)),
      descuentoINTECAP:  Number(descuentoINTECAP.toFixed(2)),
      totalDescuentos:   Number(totalDescuentos.toFixed(2)),
      netoAPagar:        Number(netoAPagar.toFixed(2)),
    };
  }

  async crearNominaConDetalles(
    idEmpleado: number,
    salarioBase: number,
    usuarioGerenteId?: number,
    mes?: number,
    anio?: number,
    idCuenta?: number,
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

    // Solo se valida duplicado para nóminas GENERALES — las personalizadas son ilimitadas
    const nominaExistente = await this.prisma.nominaEncabezado.findFirst({
      where: {
        Mes: mesFinal,
        Anio: anioFinal,
        Activo: true,
        TipoNomina: 'GENERAL',
        NominaDetalle: { some: { IdEmpleado: idEmpleado, Activo: true } },
      },
    });

    if (nominaExistente) {
      throw new BadRequestException(
        `Ya existe una nómina GENERAL para este empleado en ${mesFinal}/${anioFinal}`,
      );
    }

    const detalles = await this.calcularNomina(idEmpleado, salarioBase, mesFinal, anioFinal);
    const estadoGeneradaId = await this.getEstadoBorradorId();
    const diasLaborados = await this.getDiasLaborados(idEmpleado, mesFinal, anioFinal);

    const nomina = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: mesFinal,
        Anio: anioFinal,
        FechaGeneracion: ahora,
        TipoNomina: 'GENERAL',
        Estado: 'BORRADOR',
        IdEstadoActual: estadoGeneradaId ?? undefined,
        IdUsuarioGerente: usuarioGerenteId ?? undefined,
        IdCuenta: idCuenta ?? undefined,
        Activo: true,
        NominaDetalle: {
          create: {
            IdEmpleado: idEmpleado,
            DiasLaborados: diasLaborados,
            SueldoBase: detalles.salarioBase,
            BonificacionIncentivo:
              detalles.bono14 + detalles.aguinaldo + detalles.bonoProductividad,
            OtrosIngresos: detalles.pagoHorasExtras,
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

  async crearNominaPersonalizada(
    idEmpleados: number[],
    idParametros: number[],
    usuarioGerenteId?: number,
    mes?: number,
    anio?: number,
    idCuenta?: number,
    incluirSalarioBase = true,
  ) {
    if (!idEmpleados.length) throw new BadRequestException('Selecciona al menos un empleado');
    if (!idParametros.length) throw new BadRequestException('Selecciona al menos un parámetro');
    // Las nóminas personalizadas NO tienen restricción de duplicado por mes —
    // el usuario puede generar múltiples en el mismo período para distintos conceptos.

    const ahora     = new Date();
    const mesFinal  = mes  ?? ahora.getMonth() + 1;
    const anioFinal = anio ?? ahora.getFullYear();

    const parametros = await this.prisma.parametroGlobal.findMany({
      where: { IdParametro: { in: idParametros }, Activo: true },
    });

    const empleados = await this.prisma.empleado.findMany({
      where: { IdEmpleado: { in: idEmpleados }, Activo: true },
      include: {
        Salario: {
          where: {
            Activo: true,
            OR: [{ FechaFinVigencia: null }, { FechaFinVigencia: { gte: ahora } }],
          },
          orderBy: { FechaInicioVigencia: 'desc' },
          take: 1,
        },
      },
    });

    if (!empleados.length) throw new BadRequestException('Ningún empleado seleccionado está activo');

    const estadoId = await this.getEstadoBorradorId();

    const nominaEncabezado = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: mesFinal,
        Anio: anioFinal,
        FechaGeneracion: ahora,
        TipoNomina: 'PERSONALIZADA',
        Estado: 'BORRADOR',
        IdEstadoActual: estadoId ?? undefined,
        IdUsuarioGerente: usuarioGerenteId ?? undefined,
        IdCuenta: idCuenta ?? undefined,
        Activo: true,
      },
    });

    const detallesPromises = empleados.map(async (empleado) => {
      // Salario registrado del empleado — siempre se usa como base para calcular %
      const salarioReal = empleado.Salario[0]
        ? parseFloat(empleado.Salario[0].SalarioBase.toString())
        : 0;

      // SueldoBase que va en el detalle: 0 si el usuario eligió solo parámetros
      const sueldoBaseDetalle = incluirSalarioBase ? salarioReal : 0;

      let bonificacion    = 0;
      let otrosIngresos   = 0;
      let descIGSS        = 0;
      let descISR         = 0;
      let otrosDescuentos = 0;

      // ── Horas extra — tratamiento especial ─────────────────────────────
      const paramHorasExtra = parametros.find(p => p.NombreParametro === 'HORAS_EXTRA_PORCENTAJE');
      const paramHorasDia   = parametros.find(p => p.NombreParametro === 'HORAS_LABORALES_DIA');

      if (paramHorasExtra && this.empleadoMatcheFiltro(empleado, paramHorasExtra)) {
        const pct             = parseFloat(paramHorasExtra.Valor.toString()) / 100;
        const horasDia        = paramHorasDia ? parseFloat(paramHorasDia.Valor.toString()) : 8;
        const horasExtrasTotal = await this.getHorasExtras(empleado.IdEmpleado, mesFinal, anioFinal);
        if (horasExtrasTotal > 0) {
          const valorHoraNormal = salarioReal / 30 / horasDia;
          otrosIngresos += Number((horasExtrasTotal * valorHoraNormal * (1 + pct)).toFixed(2));
        }
      }

      const SKIP_PARAMS = new Set(['HORAS_EXTRA_PORCENTAJE', 'HORAS_LABORALES_DIA']);

      for (const param of parametros) {
        if (SKIP_PARAMS.has(param.NombreParametro)) continue;
        if (!this.empleadoMatcheFiltro(empleado, param)) continue;

        const valor = parseFloat(param.Valor.toString());
        // Los % siempre se calculan sobre el salario REAL del empleado
        const importe = (param.Unidad === '%') ? salarioReal * (valor / 100) : valor;

        if (param.Tipo === 'INGRESO') {
          const nombre = param.NombreParametro.toUpperCase();
          if (nombre.includes('BONO') || nombre.includes('AGUINALDO') || nombre.includes('INCENTIVO')) {
            bonificacion += importe;
          } else {
            otrosIngresos += importe;
          }
        } else if (param.Tipo === 'DESCUENTO') {
          const nombre = param.NombreParametro.toUpperCase();
          if (nombre.includes('IGSS'))      descIGSS        += importe;
          else if (nombre.includes('ISR'))  descISR         += importe;
          else                              otrosDescuentos += importe;
        }
      }

      const liquidoRecibir = sueldoBaseDetalle + bonificacion + otrosIngresos
                           - descIGSS - descISR - otrosDescuentos;

      return this.prisma.nominaDetalle.create({
        data: {
          IdNomina:              nominaEncabezado.IdNomina,
          IdEmpleado:            empleado.IdEmpleado,
          SueldoBase:            sueldoBaseDetalle,
          BonificacionIncentivo: bonificacion,
          OtrosIngresos:         otrosIngresos,
          DescuentoIGSS:         descIGSS,
          DescuentoISR:          descISR,
          OtrosDescuentos:       otrosDescuentos,
          LiquidoRecibir:        liquidoRecibir,
          Activo: true,
        },
        include: {
          Empleado: { select: { Nombres: true, Apellidos: true } },
        },
      });
    });

    const detalles = await Promise.all(detallesPromises);

    return {
      idNomina:           nominaEncabezado.IdNomina,
      mes:                mesFinal,
      anio:               anioFinal,
      fechaGeneracion:    nominaEncabezado.FechaGeneracion,
      totalEmpleados:     detalles.length,
      parametrosAplicados: parametros.length,
      detalles: detalles.map(d => ({
        idEmpleado:    d.IdEmpleado,
        empleado:      `${d.Empleado.Nombres} ${d.Empleado.Apellidos}`,
        liquidoRecibir: parseFloat(d.LiquidoRecibir!.toString()),
      })),
    };
  }

  async generarNominaMasiva(usuarioGerenteId?: number, mes?: number, anio?: number, idCuenta?: number) {
    const ahora = new Date();
    const mesFinal = mes ?? ahora.getMonth() + 1;
    const anioFinal = anio ?? ahora.getFullYear();

    // Solo verifica que no exista otra nómina GENERAL masiva para el mismo período
    const nominaExistente = await this.prisma.nominaEncabezado.findFirst({
      where: { Mes: mesFinal, Anio: anioFinal, Activo: true, TipoNomina: 'GENERAL' },
    });

    if (nominaExistente) {
      throw new BadRequestException(
        `Ya existe una nómina GENERAL para ${mesFinal}/${anioFinal}`,
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

    const estadoGeneradaId = await this.getEstadoBorradorId();
    const nominaEncabezado = await this.prisma.nominaEncabezado.create({
      data: {
        Mes: mesFinal,
        Anio: anioFinal,
        FechaGeneracion: ahora,
        TipoNomina: 'GENERAL',
        Estado: 'BORRADOR',
        IdEstadoActual: estadoGeneradaId ?? undefined,
        Activo: true,
        IdUsuarioGerente: usuarioGerenteId ?? undefined,
        IdCuenta: idCuenta ?? undefined,
      },
    });

    const detallesPromises = empleados.map(async (empleado) => {
      const salarioBase = parseFloat(
        empleado.Salario[0].SalarioBase.toString(),
      );
      const calculo = await this.calcularNomina(empleado.IdEmpleado, salarioBase, mesFinal, anioFinal);
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
          OtrosIngresos: calculo.pagoHorasExtras,
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
    // Validar tipo de firmante contra los configurados en BD
    const todosLosConfigs = await this.configFirmanteService.findAll();
    const tiposValidos = todosLosConfigs.map(c => c.TipoFirmante);

    if (tiposValidos.length > 0 && !tiposValidos.includes(tipoFirmante)) {
      throw new BadRequestException(
        `Tipo de firmante inválido. Tipos disponibles: ${tiposValidos.join(', ')}`,
      );
    }

    // Verificar asignación específica de ESTA nómina primero
    const asignacion = await this.prisma.firmanteAsignadoNomina.findFirst({
      where: { IdNomina: idNomina, TipoFirmante: tipoFirmante, Activo: true },
    });

    if (asignacion) {
      if (asignacion.Modo === 'USUARIO' && asignacion.IdUsuarioAsignado) {
        if (asignacion.IdUsuarioAsignado !== idUsuario) {
          const u = await this.prisma.usuario.findUnique({
            where:   { IdUsuario: asignacion.IdUsuarioAsignado },
            include: { Empleado: { select: { Nombres: true, Apellidos: true } } },
          });
          const nombre = u?.Empleado ? `${u.Empleado.Nombres} ${u.Empleado.Apellidos}` : `Usuario #${asignacion.IdUsuarioAsignado}`;
          throw new ForbiddenException(`Solo ${nombre} puede firmar como ${tipoFirmante} en esta nómina`);
        }
      } else if (asignacion.Modo === 'ROL' && asignacion.RolRequerido) {
        const usuarioFirmante = await this.prisma.usuario.findUnique({
          where:   { IdUsuario: idUsuario },
          include: { RolUsuario: { select: { NombreRol: true } } },
        });
        const rolUsuario = (usuarioFirmante?.RolUsuario?.NombreRol ?? '').trim().toUpperCase().replace(/\s+/g, '_');
        const rolReq     = asignacion.RolRequerido.trim().toUpperCase().replace(/\s+/g, '_');
        if (rolUsuario !== rolReq) {
          throw new ForbiddenException(`Solo usuarios con rol ${asignacion.RolRequerido} pueden firmar como ${tipoFirmante} en esta nómina`);
        }
      }
    } else {
      // Sin asignación específica → usar configuración global
      const { puede, razon } = await this.configFirmanteService.puedeUsuarioFirmar(tipoFirmante, idUsuario);
      if (!puede) throw new ForbiddenException(razon ?? 'No tiene permisos para firmar como este tipo');
    }

    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: idNomina, Activo: true },
      include: { EstadoNomina: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${idNomina} no encontrada`);
    }

    const estadoActual = nomina.EstadoNomina;
    if (estadoActual?.EsFinal) {
      throw new BadRequestException(
        `La nómina no puede ser firmada en el estado actual: ${estadoActual.NombreEstado}`,
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
        where: { NombreEstado: 'APROBADO' },
      });

      if (estadoAprobada) {
        await this.prisma.nominaEncabezado.update({
          where: { IdNomina: idNomina },
          data: {
            IdEstadoActual: estadoAprobada.IdEstadoNomina,
            Estado: 'APROBADO',
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

  private empleadoMatcheFiltro(
    empleado: { Genero: boolean; IdDepartamento: number | null; IdPuesto: number; IdJornada: number },
    param: { FiltroGenero: boolean | null; FiltroIdDepartamento: number | null; FiltroIdPuesto: number | null; FiltroIdJornada: number | null },
  ): boolean {
    if (param.FiltroGenero !== null && param.FiltroGenero !== undefined) {
      if (empleado.Genero !== param.FiltroGenero) return false;
    }
    if (param.FiltroIdDepartamento) {
      if (empleado.IdDepartamento !== param.FiltroIdDepartamento) return false;
    }
    if (param.FiltroIdPuesto) {
      if (empleado.IdPuesto !== param.FiltroIdPuesto) return false;
    }
    if (param.FiltroIdJornada) {
      if (empleado.IdJornada !== param.FiltroIdJornada) return false;
    }
    return true;
  }

  private async getEstadoBorradorId(): Promise<number | null> {
    const estado = await this.prisma.estadoNomina.findUnique({
      where: { NombreEstado: 'BORRADOR' },
    });
    return estado?.IdEstadoNomina ?? null;
  }

  private async getHorasExtras(idEmpleado: number, mes: number, anio: number): Promise<number> {
    if (!idEmpleado || !mes || !anio) return 0;

    const inicioMes = new Date(Date.UTC(anio, mes - 1, 1));
    const finMes    = new Date(Date.UTC(anio, mes, 0, 23, 59, 59, 999));

    // Aggregate directo — solo suma HorasExtra del empleado en el mes indicado.
    // NOT: { Activo: false } incluye registros con Activo = true Y Activo = null.
    const result = await this.prisma.asistencia.aggregate({
      _sum: { HorasExtra: true },
      where: {
        IdEmpleado: { equals: idEmpleado },
        NOT:        { Activo: false },
        Fecha:      { gte: inicioMes, lte: finMes },
        HorasExtra: { gt: 0 },
      },
    });

    return parseFloat(result._sum.HorasExtra?.toString() ?? '0');
  }

  private async getDiasLaborados(
    idEmpleado: number,
    mes: number,
    anio: number,
  ): Promise<number> {
    const inicioMes = new Date(Date.UTC(anio, mes - 1, 1));
    const finMes    = new Date(Date.UTC(anio, mes, 0, 23, 59, 59, 999));

    const asistencias = await this.prisma.asistencia.findMany({
      where: {
        IdEmpleado: idEmpleado,
        Activo: true,
        Fecha: { gte: inicioMes, lte: finMes },
      },
      select: { Fecha: true },
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
