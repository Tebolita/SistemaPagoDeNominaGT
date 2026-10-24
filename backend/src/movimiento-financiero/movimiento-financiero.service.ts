import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientoFinancieroDto, UpdateMovimientoFinancieroDto } from './dto/movimiento-financiero.dto';
import { Prisma } from 'src/generated/prisma/client';
import { Paginacion } from 'src/common/paginacion';

@Injectable()
export class MovimientoFinancieroService {
  constructor(private prisma: PrismaService) {}

  // Registrar el movimiento y ajustar el saldo ocurren juntos o no ocurren
  async create(createMovimientoDto: CreateMovimientoFinancieroDto) {
    return this.prisma.$transaction(async (tx) => {
      const movimiento = await tx.movimientoFinanciero.create({
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

      if (movimiento.Activo) {
        await this.aplicarSaldo(tx, movimiento.IdCuenta, movimiento.TipoMovimiento ?? '', Number(movimiento.Monto));
      }

      return movimiento;
    });
  }

  async findAll(
    idCuenta?: number,
    tipoMovimiento?: string,
    fechaInicio?: string,
    fechaFin?: string,
    activo?: boolean,
    paginacion?: Paginacion,
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

    const consulta = {
      where,
      include: {
        CuentaBancariaEmpresa: {
          include: { Banco: true },
        },
        Usuario: true,
        Venta: true,
        NominaEncabezado: true,
      },
      orderBy: [{ FechaMovimiento: 'desc' as const }, { IdMovimiento: 'desc' as const }],
    };

    if (!paginacion) {
      return this.prisma.movimientoFinanciero.findMany(consulta);
    }

    const [total, registros] = await Promise.all([
      this.prisma.movimientoFinanciero.count({ where }),
      this.prisma.movimientoFinanciero.findMany({ ...consulta, skip: paginacion.skip, take: paginacion.limit }),
    ]);
    return { total, page: paginacion.page, limit: paginacion.limit, registros };
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

    // Los movimientos generados por una venta o una nómina deben coincidir con su origen
    const cambiaSaldo = ['Monto', 'IdCuenta', 'TipoMovimiento', 'Activo'].some(
      (campo) => (updateMovimientoDto as Record<string, unknown>)[campo] !== undefined,
    );
    if ((original.IdVenta || original.IdNomina) && cambiaSaldo) {
      throw new BadRequestException(
        'Este movimiento lo generó una venta o una nómina: su monto, cuenta y tipo solo cambian desde ese módulo.',
      );
    }

    // Revertir el efecto anterior, actualizar y aplicar el nuevo efecto en una sola transacción
    return this.prisma.$transaction(async (tx) => {
      if (original.Activo) {
        await this.revertirSaldo(tx, original.IdCuenta, original.TipoMovimiento ?? '', Number(original.Monto));
      }

      const movimiento = await tx.movimientoFinanciero.update({
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

      if (movimiento.Activo) {
        await this.aplicarSaldo(tx, movimiento.IdCuenta, movimiento.TipoMovimiento ?? '', Number(movimiento.Monto));
      }

      return movimiento;
    });
  }

  async remove(id: number) {
    const original = await this.findOne(id);

    // Revertir el efecto en la cuenta y desactivar en una sola transacción
    return this.prisma.$transaction(async (tx) => {
      if (original.Activo) {
        await this.revertirSaldo(tx, original.IdCuenta, original.TipoMovimiento ?? '', Number(original.Monto));
      }

      return tx.movimientoFinanciero.update({
        where: { IdMovimiento: id },
        data: { Activo: false, FechaEliminacion: new Date() },
      });
    });
  }

  private async aplicarSaldo(tx: Prisma.TransactionClient, idCuenta: number, tipo: string, monto: number) {
    if (tipo === 'INGRESO') {
      await tx.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { increment: monto } },
      });
    } else if (tipo === 'EGRESO') {
      await tx.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { decrement: monto } },
      });
    }
  }

  private async revertirSaldo(tx: Prisma.TransactionClient, idCuenta: number, tipo: string, monto: number) {
    if (tipo === 'INGRESO') {
      await tx.cuentaBancariaEmpresa.update({
        where: { IdCuenta: idCuenta },
        data: { SaldoActual: { decrement: monto } },
      });
    } else if (tipo === 'EGRESO') {
      await tx.cuentaBancariaEmpresa.update({
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
