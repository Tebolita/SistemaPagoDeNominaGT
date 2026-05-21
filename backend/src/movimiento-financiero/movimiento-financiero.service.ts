import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientoFinancieroDto, UpdateMovimientoFinancieroDto } from './dto/movimiento-financiero.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class MovimientoFinancieroService {
  constructor(private prisma: PrismaService) {}

  async create(createMovimientoDto: CreateMovimientoFinancieroDto) {
    const movimiento = await this.prisma.movimientoFinanciero.create({
      data: {
        ...createMovimientoDto,
        FechaMovimiento: createMovimientoDto.FechaMovimiento ? new Date(createMovimientoDto.FechaMovimiento) : new Date(),
        Activo: createMovimientoDto.Activo ?? true,
      },
      include: {
        CuentaBancariaEmpresa: { include: { Banco: true } },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
    });

    await this.aplicarSaldo(createMovimientoDto.IdCuenta, createMovimientoDto.TipoMovimiento, createMovimientoDto.Monto);

    return movimiento;
  }

  async findAll(
    idCuenta?: number,
    tipoMovimiento?: string,
    fechaInicio?: string,
    fechaFin?: string,
    activo?: boolean,
  ) {
    const where: Prisma.MovimientoFinancieroWhereInput = {
      Activo: activo ?? true,  // Por defecto solo registros activos
    };

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
    const original = await this.findOne(id);

    // Revertir efecto original en la cuenta (solo si estaba activo)
    if (original.Activo) {
      await this.revertirSaldo(original.IdCuenta, original.TipoMovimiento ?? '', Number(original.Monto));
    }

    const movimiento = await this.prisma.movimientoFinanciero.update({
      where: { IdMovimiento: id },
      data: {
        ...updateMovimientoDto,
        FechaMovimiento: updateMovimientoDto.FechaMovimiento ? new Date(updateMovimientoDto.FechaMovimiento) : undefined,
      },
      include: {
        CuentaBancariaEmpresa: { include: { Banco: true } },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
    });

    // Aplicar nuevo efecto (solo si sigue activo)
    if (movimiento.Activo) {
      const idCuentaNueva = updateMovimientoDto.IdCuenta ?? original.IdCuenta;
      const tipoNuevo = updateMovimientoDto.TipoMovimiento ?? original.TipoMovimiento ?? '';
      const montoNuevo = updateMovimientoDto.Monto ?? Number(original.Monto);
      await this.aplicarSaldo(idCuentaNueva, tipoNuevo, montoNuevo);
    }

    return movimiento;
  }

  async remove(id: number) {
    const original = await this.findOne(id);

    // Revertir efecto en la cuenta antes de desactivar
    if (original.Activo) {
      await this.revertirSaldo(original.IdCuenta, original.TipoMovimiento ?? '', Number(original.Monto));
    }

    return this.prisma.movimientoFinanciero.update({
      where: { IdMovimiento: id },
      data: { Activo: false, FechaEliminacion: new Date() },
    });
  }

  private async aplicarSaldo(idCuenta: number, tipo: string, monto: number) {
    if (tipo === 'INGRESO') {
      await this.prisma.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { increment: monto } },
      });
    } else if (tipo === 'EGRESO') {
      await this.prisma.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { decrement: monto } },
      });
    }
  }

  private async revertirSaldo(idCuenta: number, tipo: string, monto: number) {
    if (tipo === 'INGRESO') {
      await this.prisma.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { decrement: monto } },
      });
    } else if (tipo === 'EGRESO') {
      await this.prisma.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { increment: monto } },
      });
    }
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
