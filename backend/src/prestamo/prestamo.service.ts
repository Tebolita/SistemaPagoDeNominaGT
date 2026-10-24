import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { IsInt, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/** Divide un monto en cuotas iguales a dos decimales; la última cuota ajusta los centavos. */
export function calcularCuotas(monto: number, totalCuotas: number): number[] {
  const centavos = Math.round(monto * 100);
  const base = Math.floor(centavos / totalCuotas);
  return Array.from({ length: totalCuotas }, (_, i) =>
    (i === totalCuotas - 1 ? centavos - base * (totalCuotas - 1) : base) / 100,
  );
}

export class CreatePrestamoDto {
  @IsInt() @Min(1)
  @Transform(({ value }) => parseInt(value))
  idEmpleado: number;

  @IsNumber() @Min(1)
  @Transform(({ value }) => parseFloat(value))
  montoPrestamo: number;

  @IsInt() @Min(1)
  @Transform(({ value }) => parseInt(value))
  totalCuotas: number;

  @IsString()
  fechaAprobacion: string;

  @IsOptional() @IsString()
  descripcion?: string;
}

@Injectable()
export class PrestamoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePrestamoDto) {
    const empleado = await this.prisma.empleado.findUnique({ where: { IdEmpleado: dto.idEmpleado } });
    if (!empleado) throw new NotFoundException('Empleado no encontrado');

    const cuotaMensual = parseFloat((dto.montoPrestamo / dto.totalCuotas).toFixed(2));

    const prestamo = await this.prisma.prestamoEmpleado.create({
      data: {
        IdEmpleado:      dto.idEmpleado,
        MontoPrestamo:   dto.montoPrestamo,
        CuotaMensual:    cuotaMensual,
        TotalCuotas:     dto.totalCuotas,
        CuotasPagadas:   0,
        Descripcion:     dto.descripcion ?? null,
        FechaAprobacion: new Date(dto.fechaAprobacion),
        Estado:          'ACTIVO',
        Activo:          true,
      },
    });

    // Generar cuotas: la última absorbe la diferencia de redondeo para que la suma sea exacta
    // (Q1,000 en 3 cuotas = 333.33 + 333.33 + 333.34, no 999.99)
    const cuotas = calcularCuotas(dto.montoPrestamo, dto.totalCuotas).map((monto, i) => ({
      IdPrestamo:  prestamo.IdPrestamo,
      NumeroCuota: i + 1,
      MontoCuota:  monto,
      Estado:      'PENDIENTE',
    }));
    await this.prisma.cuotaPrestamo.createMany({ data: cuotas });

    return this.findOne(prestamo.IdPrestamo);
  }

  async findAll(idEmpleado?: number) {
    const lista = await this.prisma.prestamoEmpleado.findMany({
      where: {
        NOT: { Activo: false },
        ...(idEmpleado ? { IdEmpleado: idEmpleado } : {}),
      },
      include: {
        Empleado: { select: { Nombres: true, Apellidos: true, IdEmpleado: true } },
        CuotaPrestamo: { orderBy: { NumeroCuota: 'asc' } },
      },
      orderBy: { FechaAprobacion: 'desc' },
    });
    return lista.map(this.mapPrestamo);
  }

  async findOne(id: number) {
    const p = await this.prisma.prestamoEmpleado.findUnique({
      where: { IdPrestamo: id },
      include: {
        Empleado: { select: { Nombres: true, Apellidos: true, IdEmpleado: true } },
        CuotaPrestamo: { orderBy: { NumeroCuota: 'asc' } },
      },
    });
    if (!p) throw new NotFoundException('Préstamo no encontrado');
    return this.mapPrestamo(p);
  }

  async pagarCuota(idCuota: number) {
    const cuota = await this.prisma.cuotaPrestamo.findUnique({ where: { IdCuota: idCuota } });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');
    if (cuota.Estado === 'PAGADO') throw new BadRequestException('Esta cuota ya fue pagada');

    await this.prisma.cuotaPrestamo.update({
      where: { IdCuota: idCuota },
      data: { Estado: 'PAGADO', FechaPago: new Date() },
    });

    // Actualizar conteo y cerrar si está completo
    const prestamo = await this.prisma.prestamoEmpleado.findUnique({
      where: { IdPrestamo: cuota.IdPrestamo },
      include: { CuotaPrestamo: true },
    });

    if (prestamo) {
      const pagadas = prestamo.CuotaPrestamo.filter(c => c.Estado === 'PAGADO' || c.IdCuota === idCuota).length;
      const completo = pagadas >= prestamo.TotalCuotas;
      await this.prisma.prestamoEmpleado.update({
        where: { IdPrestamo: cuota.IdPrestamo },
        data: { CuotasPagadas: pagadas, Estado: completo ? 'PAGADO' : 'ACTIVO' },
      });
    }

    return this.findOne(cuota.IdPrestamo);
  }

  async cancelar(id: number) {
    await this.findOne(id);
    return this.prisma.prestamoEmpleado.update({
      where: { IdPrestamo: id },
      data: { Estado: 'CANCELADO', Activo: false, FechaEliminacion: new Date() },
    });
  }

  private mapPrestamo(p: any) {
    return {
      ...p,
      MontoPrestamo: parseFloat(p.MontoPrestamo.toString()),
      CuotaMensual:  parseFloat(p.CuotaMensual.toString()),
      CuotaPrestamo: (p.CuotaPrestamo ?? []).map((c: any) => ({
        ...c,
        MontoCuota: parseFloat(c.MontoCuota.toString()),
      })),
      SaldoPendiente: parseFloat(
        ((p.TotalCuotas - p.CuotasPagadas) * parseFloat(p.CuotaMensual.toString())).toFixed(2)
      ),
    };
  }
}
