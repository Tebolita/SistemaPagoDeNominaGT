import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoServicioDto, UpdateProductoServicioDto } from './dto/producto-servicio.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ProductoServicioService {
  constructor(private prisma: PrismaService) {}

  async create(createProductoServicioDto: CreateProductoServicioDto) {
    return this.prisma.productoServicio.create({
      data: {
        ...createProductoServicioDto,
        Activo: createProductoServicioDto.Activo ?? true,
      },
    });
  }

  async findAll(activo?: boolean, tipo?: string) {
    const where: Prisma.ProductoServicioWhereInput = {};
    if (activo !== undefined) {
      where.Activo = activo;
    }
    if (tipo) {
      where.TipoProducto = tipo;
    }

    return this.prisma.productoServicio.findMany({
      where,
      orderBy: { NombreProducto: 'asc' },
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.productoServicio.findUnique({
      where: { IdProducto: id },
    });

    if (!producto) {
      throw new NotFoundException('Producto/Servicio no encontrado');
    }

    return producto;
  }

  async update(id: number, updateProductoServicioDto: UpdateProductoServicioDto) {
    // Verificar que el producto existe
    await this.findOne(id);

    return this.prisma.productoServicio.update({
      where: { IdProducto: id },
      data: updateProductoServicioDto,
    });
  }

  async remove(id: number) {
    // Verificar que el producto existe
    await this.findOne(id);

    // Soft delete
    return this.prisma.productoServicio.update({
      where: { IdProducto: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}