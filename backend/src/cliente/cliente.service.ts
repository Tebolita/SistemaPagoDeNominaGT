import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}

  async create(createClienteDto: CreateClienteDto) {
    // Validar unicidad de NIT si se proporciona
    if (createClienteDto.NIT) {
      const existingNIT = await this.prisma.cliente.findFirst({
        where: {
          NIT: createClienteDto.NIT,
          Activo: true,
        },
      });
      if (existingNIT) {
        throw new ConflictException('Ya existe un cliente con este NIT');
      }
    }

    // Validar unicidad de DPI si se proporciona
    if (createClienteDto.DPI) {
      const existingDPI = await this.prisma.cliente.findFirst({
        where: {
          DPI: createClienteDto.DPI,
          Activo: true,
        },
      });
      if (existingDPI) {
        throw new ConflictException('Ya existe un cliente con este DPI');
      }
    }

    // Validar unicidad de correo si se proporciona
    if (createClienteDto.Correo) {
      const existingCorreo = await this.prisma.cliente.findFirst({
        where: {
          Correo: createClienteDto.Correo,
          Activo: true,
        },
      });
      if (existingCorreo) {
        throw new ConflictException('Ya existe un cliente con este correo electrónico');
      }
    }

    return this.prisma.cliente.create({
      data: {
        ...createClienteDto,
        Activo: createClienteDto.Activo ?? true,
      },
    });
  }

  async findAll(activo?: boolean) {
    const where: Prisma.ClienteWhereInput = {};
    if (activo !== undefined) {
      where.Activo = activo;
    }

    return this.prisma.cliente.findMany({
      where,
      orderBy: { NombreCliente: 'asc' },
    });
  }

  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { IdCliente: id },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    // Verificar que el cliente existe
    await this.findOne(id);

    // Validar unicidad de NIT si se proporciona
    if (updateClienteDto.NIT) {
      const existingNIT = await this.prisma.cliente.findFirst({
        where: {
          NIT: updateClienteDto.NIT,
          Activo: true,
          IdCliente: { not: id },
        },
      });
      if (existingNIT) {
        throw new ConflictException('Ya existe otro cliente con este NIT');
      }
    }

    // Validar unicidad de DPI si se proporciona
    if (updateClienteDto.DPI) {
      const existingDPI = await this.prisma.cliente.findFirst({
        where: {
          DPI: updateClienteDto.DPI,
          Activo: true,
          IdCliente: { not: id },
        },
      });
      if (existingDPI) {
        throw new ConflictException('Ya existe otro cliente con este DPI');
      }
    }

    // Validar unicidad de correo si se proporciona
    if (updateClienteDto.Correo) {
      const existingCorreo = await this.prisma.cliente.findFirst({
        where: {
          Correo: updateClienteDto.Correo,
          Activo: true,
          IdCliente: { not: id },
        },
      });
      if (existingCorreo) {
        throw new ConflictException('Ya existe otro cliente con este correo electrónico');
      }
    }

    return this.prisma.cliente.update({
      where: { IdCliente: id },
      data: updateClienteDto,
    });
  }

  async remove(id: number) {
    // Verificar que el cliente existe
    await this.findOne(id);

    // Soft delete
    return this.prisma.cliente.update({
      where: { IdCliente: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}
