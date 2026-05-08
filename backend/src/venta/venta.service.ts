import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto, UpdateVentaDto } from './dto/venta.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class VentaService {
  constructor(private prisma: PrismaService) {}

  async create(createVentaDto: CreateVentaDto, idUsuario: number) {
    // Validar que el cliente existe si se proporciona
    if (createVentaDto.IdCliente) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { IdCliente: createVentaDto.IdCliente },
      });
      if (!cliente || !cliente.Activo) {
        throw new NotFoundException('Cliente no encontrado o inactivo');
      }
    }

    // Validar que todos los productos existen y están activos
    for (const detalle of createVentaDto.Detalles) {
      const producto = await this.prisma.productoServicio.findUnique({
        where: { IdProducto: detalle.IdProducto },
      });
      if (!producto || !producto.Activo) {
        throw new NotFoundException(`Producto/Servicio ${detalle.IdProducto} no encontrado o inactivo`);
      }
    }

    // Calcular subtotales y totales
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

    // Calcular impuestos (asumiendo 12% IVA en Guatemala)
    const descuentoGeneral = createVentaDto.Descuento || 0;
    const subtotalConDescuento = subtotalGeneral - descuentoGeneral;
    const impuestos = subtotalConDescuento * 0.12;
    const total = subtotalConDescuento + impuestos;

    // Crear la venta con detalles en una transacción
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
          Notas: createVentaDto.Notas,
          Activo: true,
          DetalleVenta: {
            create: detallesConSubtotal,
          },
        },
        include: {
          DetalleVenta: {
            include: {
              ProductoServicio: true,
            },
          },
          Cliente: true,
          Usuario: true,
        },
      });

      return venta;
    });
  }

  async findAll(fechaInicio?: string, fechaFin?: string, estadoPago?: string, idCliente?: number) {
    const where: Prisma.VentaWhereInput = {};

    if (fechaInicio && fechaFin) {
      where.FechaVenta = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    }

    if (estadoPago) {
      where.EstadoPago = estadoPago;
    }

    if (idCliente) {
      where.IdCliente = idCliente;
    }

    return this.prisma.venta.findMany({
      where,
      include: {
        DetalleVenta: {
          include: {
            ProductoServicio: true,
          },
        },
        Cliente: true,
        Usuario: true,
      },
      orderBy: { FechaVenta: 'desc' },
    });
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { IdVenta: id },
      include: {
        DetalleVenta: {
          include: {
            ProductoServicio: true,
          },
        },
        Cliente: true,
        Usuario: true,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }

    return venta;
  }

  async update(id: number, updateVentaDto: UpdateVentaDto) {
    // Verificar que la venta existe
    const ventaExistente = await this.findOne(id);

    // Validar que el cliente existe si se proporciona
    if (updateVentaDto.IdCliente) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { IdCliente: updateVentaDto.IdCliente },
      });
      if (!cliente || !cliente.Activo) {
        throw new NotFoundException('Cliente no encontrado o inactivo');
      }
    }

    // Actualizar la venta
    return this.prisma.venta.update({
      where: { IdVenta: id },
      data: {
        IdCliente: updateVentaDto.IdCliente,
        FechaVenta: updateVentaDto.FechaVenta ? new Date(updateVentaDto.FechaVenta) : undefined,
        TipoVenta: updateVentaDto.TipoVenta,
        Descuento: updateVentaDto.Descuento,
        EstadoPago: updateVentaDto.EstadoPago,
        FechaVencimiento: updateVentaDto.FechaVencimiento ? new Date(updateVentaDto.FechaVencimiento) : undefined,
        Notas: updateVentaDto.Notas,
      },
      include: {
        DetalleVenta: {
          include: {
            ProductoServicio: true,
          },
        },
        Cliente: true,
        Usuario: true,
      },
    });
  }

  async remove(id: number) {
    // Verificar que la venta existe
    await this.findOne(id);

    // Soft delete
    return this.prisma.venta.update({
      where: { IdVenta: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }

  async updateEstadoPago(id: number, estadoPago: string) {
    if (!['PENDIENTE', 'PAGADO', 'CANCELADO', 'VENCIDO'].includes(estadoPago)) {
      throw new BadRequestException('Estado de pago inválido');
    }

    // Verificar que la venta existe
    await this.findOne(id);

    return this.prisma.venta.update({
      where: { IdVenta: id },
      data: { EstadoPago: estadoPago },
      include: {
        DetalleVenta: {
          include: {
            ProductoServicio: true,
          },
        },
        Cliente: true,
        Usuario: true,
      },
    });
  }
}