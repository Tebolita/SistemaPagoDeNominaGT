import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Injectable()
export class DepartamentoService {
  constructor(private prismaService: PrismaService) {}

  async getPresupuestoUsado(idDepartamento: number, excludeIdEmpleado?: number): Promise<number> {
    const empleados = await this.prismaService.empleado.findMany({
      where: {
        IdDepartamento: idDepartamento,
        NOT: { Activo: false },
        ...(excludeIdEmpleado ? { IdEmpleado: { not: excludeIdEmpleado } } : {}),
      },
      select: { IdEmpleado: true },
    });

    if (empleados.length === 0) return 0;

    const ids = empleados.map((e) => e.IdEmpleado);
    const result = await this.prismaService.salario.aggregate({
      _sum: { SalarioBase: true },
      where: { IdEmpleado: { in: ids }, NOT: { Activo: false } },
    });

    return parseFloat(result._sum.SalarioBase?.toString() ?? '0');
  }

  create(createDepartamentoDto: CreateDepartamentoDto) {
    return this.prismaService.departamento.create({ data: createDepartamentoDto });
  }

  async findAll() {
    const departamentos = await this.prismaService.departamento.findMany({
      where: { OR: [{ Activo: true }, { Activo: null }] },
      include: { Puesto: true },
      orderBy: { NombreDepartamento: 'asc' },
    });

    return Promise.all(
      departamentos.map(async (dept) => ({
        ...dept,
        Presupuesto: dept.Presupuesto ? parseFloat(dept.Presupuesto.toString()) : null,
        PresupuestoUsado: await this.getPresupuestoUsado(dept.IdDepartamento),
      })),
    );
  }

  async findOne(id: number) {
    const dept = await this.prismaService.departamento.findUnique({
      where: { IdDepartamento: id },
      include: { Puesto: true },
    });
    if (!dept) return null;
    return {
      ...dept,
      Presupuesto: dept.Presupuesto ? parseFloat(dept.Presupuesto.toString()) : null,
      PresupuestoUsado: await this.getPresupuestoUsado(id),
    };
  }

  update(id: number, updateDepartamentoDto: UpdateDepartamentoDto) {
    return this.prismaService.departamento.update({
      where: { IdDepartamento: id },
      data: updateDepartamentoDto,
    });
  }

  remove(id: number) {
    return this.prismaService.departamento.update({
      where: { IdDepartamento: id },
      data: { Activo: false, FechaEliminacion: new Date() },
    });
  }
}
