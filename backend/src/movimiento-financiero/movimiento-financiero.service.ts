import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientoFinancieroDto, UpdateMovimientoFinancieroDto } from './dto/movimiento-financiero.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class MovimientoFinancieroService {
  constructor(private prisma: PrismaService) {}

  async create(createMovimientoDto: CreateMovimientoFinancieroDto) {
    return this.prisma.movimientoFinanciero.create({
      data: {
        ...createMovimientoDto,
        FechaMovimiento: createMovimientoDto.FechaMovimiento ? new Date(createMovimientoDto.FechaMovimiento) : new Date(),
        Activo: createMovimientoDto.Activo ?? true,
      },
      include: {
        CuentaBancariaEmpresa: {
          include: { Banco: true },
        },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
    });
  }

  async findAll(
    idCuenta?: number,
    tipoMovimiento?: string,
    fechaInicio?: string,
    fechaFin?: string,
    activo?: boolean,
  ) {
    const where: Prisma.MovimientoFinancieroWhereInput = {};

    if (idCuenta) {
      where.IdCuenta = idCuenta;
    }

    if (tipoMovimiento) {
      where.TipoMovimiento = tipoMovimiento;
    }

    if (fechaInicio && fechaFin) {
      where.FechaMovimiento = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    }

    if (activo !== undefined) {
      where.Activo = activo;
    }

    return this.prisma.movimientoFinanciero.findMany({
      where,
      include: {
        CuentaBancariaEmpresa: {
          include: { Banco: true },
        },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
      orderBy: { FechaMovimiento: 'desc' },
    });
  }

  async findOne(id: number) {
    const movimiento = await this.prisma.movimientoFinanciero.findUnique({
      where: { IdMovimiento: id },
      include: {
        CuentaBancariaEmpresa: {
          include: { Banco: true },
        },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
    });

    if (!movimiento) {
      throw new NotFoundException('Movimiento financiero no encontrado');
    }

    return movimiento;
  }

  async update(id: number, updateMovimientoDto: UpdateMovimientoFinancieroDto) {
    // Verificar que el movimiento existe
    await this.findOne(id);

    return this.prisma.movimientoFinanciero.update({
      where: { IdMovimiento: id },
      data: {
        ...updateMovimientoDto,
        FechaMovimiento: updateMovimientoDto.FechaMovimiento ? new Date(updateMovimientoDto.FechaMovimiento) : undefined,
      },
      include: {
        CuentaBancariaEmpresa: {
          include: { Banco: true },
        },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
    });
  }

  async remove(id: number) {
    // Verificar que el movimiento existe
    await this.findOne(id);

    // Soft delete
    return this.prisma.movimientoFinanciero.update({
      where: { IdMovimiento: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }

  async getBalancePorCuenta(idCuenta: number): Promise<{ saldo: number; ingresos: number; egresos: number }> {
    const movimientos = await this.prisma.movimientoFinanciero.findMany({
      where: {
        IdCuenta: idCuenta,
        Activo: true,
      },
    });

    let ingresos = 0;
    let egresos = 0;

    movimientos.forEach((mov) => {
      if (mov.TipoMovimiento === 'INGRESO') {
        ingresos += Number(mov.Monto);
      } else if (mov.TipoMovimiento === 'EGRESO') {
        egresos += Number(mov.Monto);
      }
    });

    const saldo = ingresos - egresos;

    return { saldo, ingresos, egresos };
  }
}
