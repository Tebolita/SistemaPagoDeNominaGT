import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCuentaBancariaEmpresaDto, UpdateCuentaBancariaEmpresaDto } from './dto/cuenta-bancaria-empresa.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class CuentaBancariaEmpresaService {
  constructor(private prisma: PrismaService) {}

  async create(createCuentaDto: CreateCuentaBancariaEmpresaDto) {
    // Validar que el número de cuenta sea único
    const existingCuenta = await this.prisma.cuentaBancariaEmpresa.findFirst({
      where: {
        NumeroCuenta: createCuentaDto.NumeroCuenta,
        Activo: true,
      },
    });

    if (existingCuenta) {
      throw new ConflictException('Ya existe una cuenta bancaria con este número');
    }

    return this.prisma.cuentaBancariaEmpresa.create({
      data: {
        ...createCuentaDto,
        SaldoActual: createCuentaDto.SaldoActual ?? 0,
        Activo: createCuentaDto.Activo ?? true,
      },
      include: {
        Banco: true,
      },
    });
  }

  async findAll(activo?: boolean) {
    const where: Prisma.CuentaBancariaEmpresaWhereInput = {};
    if (activo !== undefined) {
      where.Activo = activo;
    }

    return this.prisma.cuentaBancariaEmpresa.findMany({
      where,
      include: {
        Banco: true,
      },
      orderBy: { NombreCuenta: 'asc' },
    });
  }

  async findOne(id: number) {
    const cuenta = await this.prisma.cuentaBancariaEmpresa.findUnique({
      where: { IdCuenta: id },
      include: {
        Banco: true,
        MovimientoFinanciero: {
          orderBy: { FechaMovimiento: 'desc' },
          take: 10,
        },
      },
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }

    return cuenta;
  }

  async update(id: number, updateCuentaDto: UpdateCuentaBancariaEmpresaDto) {
    // Verificar que la cuenta existe
    await this.findOne(id);

    // Validar unicidad del número de cuenta si se actualiza
    if (updateCuentaDto.NumeroCuenta) {
      const existingCuenta = await this.prisma.cuentaBancariaEmpresa.findFirst({
        where: {
          NumeroCuenta: updateCuentaDto.NumeroCuenta,
          IdCuenta: { not: id },
          Activo: true,
        },
      });

      if (existingCuenta) {
        throw new ConflictException('Ya existe otra cuenta bancaria con este número');
      }
    }

    return this.prisma.cuentaBancariaEmpresa.update({
      where: { IdCuenta: id },
      data: updateCuentaDto,
      include: {
        Banco: true,
      },
    });
  }

  async updateSaldo(id: number, nuevoSaldo: number) {
    await this.findOne(id);

    return this.prisma.cuentaBancariaEmpresa.update({
      where: { IdCuenta: id },
      data: { SaldoActual: nuevoSaldo },
    });
  }

  async remove(id: number) {
    // Verificar que la cuenta existe
    await this.findOne(id);

    // Soft delete
    return this.prisma.cuentaBancariaEmpresa.update({
      where: { IdCuenta: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }

  async reactivate(id: number) {
    // Verificar que la cuenta existe
    await this.findOne(id);

    // Reactivar cuenta
    return this.prisma.cuentaBancariaEmpresa.update({
      where: { IdCuenta: id },
      data: {
        Activo: true,
        FechaEliminacion: null,
      },
      include: {
        Banco: true,
      },
    });
  }
}
