import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto, UpdateVentaDto } from './dto/venta.dto';
import { Prisma } from 'src/generated/prisma/client';

const VENTA_INCLUDE = {
  DetalleVenta: {
    include: { ProductoServicio: true },
  },
  Cliente: true,
  Usuario: { select: { Username: true } },
  CuentaBancariaEmpresa: {
    select: { IdCuenta: true, NombreCuenta: true, NumeroCuenta: true, SaldoActual: true },
  },
};

@Injectable()
export class VentaService {
  constructor(private prisma: PrismaService) {}

  async create(createVentaDto: CreateVentaDto, idUsuario: number) {
    if (createVentaDto.IdCliente) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { IdCliente: createVentaDto.IdCliente },
      });
      if (!cliente || !cliente.Activo) {
        throw new NotFoundException('Cliente no encontrado o inactivo');
      }
    }

    for (const detalle of createVentaDto.Detalles) {
      const producto = await this.prisma.productoServicio.findUnique({
        where: { IdProducto: detalle.IdProducto },
      });
      if (!producto || !producto.Activo) {
        throw new NotFoundException(`Producto/Servicio ${detalle.IdProducto} no encontrado o inactivo`);
      }
    }

    let subtotalGeneral = 0;
    const detallesConSubtotal = createVentaDto.Detalles.map(detalle => {
      const subtotal = (detalle.Cantidad * detalle.PrecioUnitario) - (detalle.Descuento || 0);
      subtotalGeneral += subtotal;
      return {
        IdProducto: detalle.IdProducto,
        Cantidad: detalle.Cantidad,
        PrecioUnitario: detalle.PrecioUnitario,
        Descuento: detalle.Descuento || 0,
        Subtotal: subtotal,
        Activo: true,
      };
    });

    const descuentoGeneral = createVentaDto.Descuento || 0;
    const subtotalConDescuento = subtotalGeneral - descuentoGeneral;
    const impuestos = subtotalConDescuento * 0.12;
    const total = subtotalConDescuento + impuestos;
    const esPagado = createVentaDto.EstadoPago === 'PAGADO';

    return this.prisma.$transaction(async (prisma) => {
      const venta = await prisma.venta.create({
        data: {
          IdCliente: createVentaDto.IdCliente,
          FechaVenta: createVentaDto.FechaVenta ? new Date(createVentaDto.FechaVenta) : new Date(),
          TipoVenta: createVentaDto.TipoVenta || 'CONTADO',
          Subtotal: subtotalGeneral,
          Descuento: descuentoGeneral,
          Impuestos: impuestos,
          Total: total,
          EstadoPago: createVentaDto.EstadoPago || 'PENDIENTE',
          FechaVencimiento: createVentaDto.FechaVencimiento ? new Date(createVentaDto.FechaVencimiento) : null,
          IdUsuarioRegistra: idUsuario,
          IdCuenta: createVentaDto.IdCuenta ?? null,
          Notas: createVentaDto.Notas,
          Activo: true,
          DetalleVenta: { create: detallesConSubtotal },
        },
        include: VENTA_INCLUDE,
      });

      if (esPagado && createVentaDto.IdCuenta) {
        await this.registrarIngreso(prisma, venta.IdVenta, createVentaDto.IdCuenta, total, idUsuario);
      }

      return venta;
    });
  }

  async findAll(fechaInicio?: string, fechaFin?: string, estadoPago?: string, idCliente?: number) {
    const where: Prisma.VentaWhereInput = { Activo: true };

    if (fechaInicio && fechaFin) {
      where.FechaVenta = { gte: new Date(fechaInicio), lte: new Date(fechaFin) };
    }
    if (estadoPago) where.EstadoPago = estadoPago;
    if (idCliente) where.IdCliente = idCliente;

    return this.prisma.venta.findMany({
      where,
      include: VENTA_INCLUDE,
      orderBy: { FechaVenta: 'desc' },
    });
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { IdVenta: id },
      include: VENTA_INCLUDE,
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return venta;
  }

  async update(id: number, updateVentaDto: UpdateVentaDto) {
    await this.findOne(id);

    if (updateVentaDto.IdCliente) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { IdCliente: updateVentaDto.IdCliente },
      });
      if (!cliente || !cliente.Activo) {
        throw new NotFoundException('Cliente no encontrado o inactivo');
      }
    }

    return this.prisma.venta.update({
      where: { IdVenta: id },
      data: {
        IdCliente: updateVentaDto.IdCliente,
        FechaVenta: updateVentaDto.FechaVenta ? new Date(updateVentaDto.FechaVenta) : undefined,
        TipoVenta: updateVentaDto.TipoVenta,
        Descuento: updateVentaDto.Descuento,
        EstadoPago: updateVentaDto.EstadoPago,
        FechaVencimiento: updateVentaDto.FechaVencimiento ? new Date(updateVentaDto.FechaVencimiento) : undefined,
        IdCuenta: updateVentaDto.IdCuenta,
        Notas: updateVentaDto.Notas,
      },
      include: VENTA_INCLUDE,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.venta.update({
      where: { IdVenta: id },
      data: { Activo: false, FechaEliminacion: new Date() },
    });
  }

  async updateEstadoPago(id: number, estadoPago: string, idCuenta?: number, idUsuario = 1) {
    if (!['PENDIENTE', 'PAGADO', 'CANCELADO', 'VENCIDO'].includes(estadoPago)) {
      throw new BadRequestException('Estado de pago inválido');
    }

    const venta = await this.findOne(id);
    const estadoAnterior = venta.EstadoPago;
    const idCuentaFinal = idCuenta ?? venta.IdCuenta ?? undefined;

    // ── Transición a PAGADO ──────────────────────────────────────────────────
    if (estadoPago === 'PAGADO' && estadoAnterior !== 'PAGADO') {
      if (!idCuentaFinal) {
        throw new BadRequestException(
          'Debe seleccionar una cuenta bancaria para registrar el cobro de la venta',
        );
      }

      const cuenta = await this.prisma.cuentaBancariaEmpresa.findUnique({
        where: { IdCuenta: idCuentaFinal },
      });
      if (!cuenta) throw new BadRequestException('Cuenta bancaria no encontrada');

      await this.registrarIngreso(this.prisma, id, idCuentaFinal, Number(venta.Total), idUsuario);
    }

    // ── Transición a CANCELADO desde PAGADO ──────────────────────────────────
    if (estadoPago === 'CANCELADO' && estadoAnterior === 'PAGADO') {
      const movimiento = await this.prisma.movimientoFinanciero.findFirst({
        where: { IdVenta: id, TipoMovimiento: 'INGRESO', Activo: true },
      });

      if (movimiento) {
        await this.prisma.cuentaBancariaEmpresa.update({
          where: { IdCuenta: movimiento.IdCuenta },
          data: { SaldoActual: { decrement: Number(movimiento.Monto) } },
        });
        await this.prisma.movimientoFinanciero.update({
          where: { IdMovimiento: movimiento.IdMovimiento },
          data: { Activo: false, FechaEliminacion: new Date() },
        });
      }
    }

    return this.prisma.venta.update({
      where: { IdVenta: id },
      data: {
        EstadoPago: estadoPago,
        IdCuenta: idCuentaFinal ?? undefined,
      },
      include: VENTA_INCLUDE,
    });
  }

  // ── Helper privado ────────────────────────────────────────────────────────
  private async registrarIngreso(prismaClient: any, idVenta: number, idCuenta: number, monto: number, idUsuario: number) {
    const venta = await prismaClient.venta.findUnique({
      where: { IdVenta: idVenta },
      include: { Cliente: true },
    });

    await prismaClient.movimientoFinanciero.create({
      data: {
        IdCuenta: idCuenta,
        TipoMovimiento: 'INGRESO',
        Categoria: 'VENTA',
        Subcategoria: 'COBRO_VENTA',
        Monto: monto,
        FechaMovimiento: new Date(),
        Referencia: `VENTA-${idVenta}`,
        IdUsuarioRegistra: idUsuario,
        IdVenta: idVenta,
        Notas: `Cobro venta #${idVenta}${venta?.Cliente ? ` — ${venta.Cliente.NombreCliente}` : ''}`,
        Activo: true,
      },
    });

    await prismaClient.cuentaBancariaEmpresa.update({
      where: { IdCuenta: idCuenta },
      data: { SaldoActual: { increment: monto } },
    });
  }
}
