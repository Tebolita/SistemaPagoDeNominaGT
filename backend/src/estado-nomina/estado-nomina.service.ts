import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstadoNominaDto } from './dto/create-estado-nomina.dto';
import { UpdateEstadoNominaDto } from './dto/update-estado-nomina.dto';
import { CambiarEstadoNominaDto } from './dto/cambiar-estado-nomina.dto';

@Injectable()
export class EstadoNominaService {
  constructor(private prisma: PrismaService) {}

  // ── CRUD básico ───────────────────────────────────────────────────────────

  async create(createEstadoNominaDto: CreateEstadoNominaDto) {
    return this.prisma.estadoNomina.create({
      data: {
        ...createEstadoNominaDto,
        Activo: createEstadoNominaDto.Activo ?? true,
        RequiereAprobacion: createEstadoNominaDto.RequiereAprobacion ?? false,
        EsFinal: createEstadoNominaDto.EsFinal ?? false,
        EsCancelacion: createEstadoNominaDto.EsCancelacion ?? false,
      },
    });
  }

  async findAll() {
    return this.prisma.estadoNomina.findMany({
      where: { OR: [{ Activo: true }, { Activo: null }] },
      orderBy: { Orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const estado = await this.prisma.estadoNomina.findUnique({
      where: { IdEstadoNomina: id },
    });
    if (!estado) {
      throw new NotFoundException(`Estado de nómina con ID ${id} no encontrado`);
    }
    return estado;
  }

  async update(id: number, updateEstadoNominaDto: UpdateEstadoNominaDto) {
    await this.findOne(id);
    return this.prisma.estadoNomina.update({
      where: { IdEstadoNomina: id },
      data: updateEstadoNominaDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.estadoNomina.update({
      where: { IdEstadoNomina: id },
      data: { Activo: false },
    });
  }

  // ── Transiciones dinámicas basadas en Orden ───────────────────────────────

  /**
   * Devuelve los estados disponibles para una nómina:
   * - Si el estado actual es EsFinal → ninguno
   * - De lo contrario:
   *   1. Todos los estados con Orden = (mínimo Orden activo > actual)
   *   2. Más cualquier estado con EsCancelacion = true (cancelación disponible siempre)
   */
  async getEstadosDisponibles(IdNomina: number, userRole?: string) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina },
      include: { EstadoNomina: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${IdNomina} no encontrada`);
    }

    const estadoActual = nomina.EstadoNomina;

    // Sin estado asignado: devolver todos los del primer nivel
    if (!estadoActual) {
      const todos = await this.prisma.estadoNomina.findMany({
        where: { Activo: true },
        orderBy: { Orden: 'asc' },
      });
      return todos.filter(e => this.puedeCambiarAEstado(e, userRole));
    }

    // Estado final → no hay más transiciones
    if (estadoActual.EsFinal) return [];

    const todosActivos = await this.prisma.estadoNomina.findMany({
      where: { Activo: true },
      orderBy: { Orden: 'asc' },
    });

    // Siguiente nivel: mínimo Orden mayor al actual, excluyendo EsCancelacion y EsFinal libres
    const siguienteOrden = todosActivos
      .filter(e => e.Orden > estadoActual.Orden && !e.EsCancelacion)
      .sort((a, b) => a.Orden - b.Orden)[0]?.Orden;

    const disponibles = todosActivos.filter(e =>
      (siguienteOrden !== undefined && e.Orden === siguienteOrden) ||
      (e.EsCancelacion && e.IdEstadoNomina !== estadoActual.IdEstadoNomina),
    );

    return disponibles.filter(e => this.puedeCambiarAEstado(e, userRole));
  }

  // ── Cambio de estado ──────────────────────────────────────────────────────

  async cambiarEstadoNomina(
    cambiarEstadoDto: CambiarEstadoNominaDto,
    idUsuario: number,
    userRole?: string,
  ) {
    const { IdNomina, IdEstadoNuevo, Comentarios, NumeroBoleta, IdCuenta } = cambiarEstadoDto;

    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina },
      include: { EstadoNomina: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${IdNomina} no encontrada`);
    }

    const estadoNuevo = await this.findOne(IdEstadoNuevo);

    if (!this.puedeCambiarAEstado(estadoNuevo, userRole)) {
      throw new ForbiddenException('No tiene permisos para cambiar al estado solicitado');
    }

    // Validar que la transición sea válida según la lógica de Orden
    if (nomina.EstadoNomina) {
      const estadosDisponibles = await this.getEstadosDisponibles(IdNomina, userRole);
      const estaDisponible = estadosDisponibles.some(e => e.IdEstadoNomina === IdEstadoNuevo);
      if (!estaDisponible) {
        throw new BadRequestException('Transición de estado no permitida');
      }
    }

    // ── Lógica especial: PAGADO ───────────────────────────────────────────
    if (estadoNuevo.EsFinal && !estadoNuevo.EsCancelacion) {
      if (!NumeroBoleta?.trim()) {
        throw new BadRequestException(
          'El número de boleta o transacción es requerido para registrar el pago',
        );
      }

      const idCuentaFinal = IdCuenta ?? nomina.IdCuenta;
      if (!idCuentaFinal) {
        throw new BadRequestException(
          'Debe seleccionar una cuenta bancaria desde la cual se descontará el pago de la nómina',
        );
      }

      const nominaConDetalles = await this.prisma.nominaEncabezado.findUnique({
        where: { IdNomina },
        include: {
          NominaDetalle: { where: { Activo: true } },
          CuentaBancariaEmpresa: true,
        },
      });

      const totalPago = (nominaConDetalles?.NominaDetalle ?? []).reduce(
        (sum, d) => sum + parseFloat(d.LiquidoRecibir?.toString() ?? '0'),
        0,
      );

      const cuenta =
        IdCuenta && IdCuenta !== nomina.IdCuenta
          ? await this.prisma.cuentaBancariaEmpresa.findUnique({ where: { IdCuenta } })
          : nominaConDetalles?.CuentaBancariaEmpresa;

      if (!cuenta) throw new BadRequestException('Cuenta bancaria no encontrada');

      const saldoActual = parseFloat(cuenta.SaldoActual?.toString() ?? '0');
      if (saldoActual < totalPago) {
        throw new BadRequestException(
          `Saldo insuficiente en "${cuenta.NombreCuenta}". ` +
          `Disponible: Q ${saldoActual.toFixed(2)}, Total nómina: Q ${totalPago.toFixed(2)}`,
        );
      }

      await this.prisma.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuentaFinal },
        data: { SaldoActual: { decrement: totalPago } },
      });

      await this.prisma.movimientoFinanciero.create({
        data: {
          IdCuenta: idCuentaFinal,
          TipoMovimiento: 'EGRESO',
          Categoria: 'NOMINA',
          Subcategoria: 'PAGO_NOMINA',
          Monto: totalPago,
          FechaMovimiento: new Date(),
          Referencia: NumeroBoleta.trim(),
          IdUsuarioRegistra: idUsuario,
          IdNomina,
          Notas: `Pago nómina ${String(nomina.Mes).padStart(2, '0')}/${nomina.Anio} — Boleta: ${NumeroBoleta.trim()}`,
          Activo: true,
        },
      });
    }

    // ── Historial ─────────────────────────────────────────────────────────
    await this.prisma.historialEstadoNomina.create({
      data: {
        IdNomina,
        IdEstadoAnterior: nomina.IdEstadoActual,
        IdEstadoNuevo,
        IdUsuarioCambio: idUsuario,
        FechaCambio: new Date(),
        Comentarios,
        Activo: true,
      },
    });

    const updateData: any = {
      IdEstadoActual: IdEstadoNuevo,
      Estado: estadoNuevo.NombreEstado,
    };
    if (NumeroBoleta?.trim()) updateData.NumeroBoleta = NumeroBoleta.trim();
    if (IdCuenta) updateData.IdCuenta = IdCuenta;

    return this.prisma.nominaEncabezado.update({
      where: { IdNomina },
      data: updateData,
      include: { EstadoNomina: true },
    });
  }

  // ── Historial ─────────────────────────────────────────────────────────────

  async getHistorialEstados(IdNomina: number) {
    return this.prisma.historialEstadoNomina.findMany({
      where: { IdNomina },
      include: {
        EstadoNomina_HistorialEstadoNomina_IdEstadoAnteriorToEstadoNomina: {
          select: { NombreEstado: true },
        },
        EstadoNomina_HistorialEstadoNomina_IdEstadoNuevoToEstadoNomina: {
          select: { NombreEstado: true },
        },
        Usuario: { select: { Username: true } },
      },
      orderBy: { FechaCambio: 'desc' },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private puedeCambiarAEstado(estado: any, userRole?: string): boolean {
    if (!estado.RequiereAprobacion) return true;
    if (!userRole) return false;
    const r = userRole.trim().toUpperCase().replace(/\s+/g, '_');
    return ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS_HUMANOS'].includes(r);
  }
}
