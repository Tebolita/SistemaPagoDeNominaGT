import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSalarioDto } from './dto/create-salario.dto';
import { UpdateSalarioDto } from './dto/update-salario.dto';

@Injectable()
export class SalarioService {
  constructor(private prismaService: PrismaService) {}

  private async verificarPresupuestoDepartamento(
    idDepartamento: number,
    idEmpleado: number,
    salarioNuevo: number,
  ): Promise<void> {
    const dept = await this.prismaService.departamento.findUnique({
      where: { IdDepartamento: idDepartamento },
      select: { Presupuesto: true, NombreDepartamento: true },
    });

    if (!dept || dept.Presupuesto === null) return;

    const presupuesto = parseFloat(dept.Presupuesto.toString());

    // Sumar salarios activos de todos los empleados del departamento EXCEPTO este
    const empleados = await this.prismaService.empleado.findMany({
      where: { IdDepartamento: idDepartamento, NOT: { Activo: false }, IdEmpleado: { not: idEmpleado } },
      select: { IdEmpleado: true },
    });

    let usado = 0;
    if (empleados.length > 0) {
      const ids = empleados.map((e) => e.IdEmpleado);
      const result = await this.prismaService.salario.aggregate({
        _sum: { SalarioBase: true },
        where: { IdEmpleado: { in: ids }, NOT: { Activo: false } },
      });
      usado = parseFloat(result._sum.SalarioBase?.toString() ?? '0');
    }

    if (usado + salarioNuevo > presupuesto) {
      const disponible = Math.max(0, presupuesto - usado);
      throw new BadRequestException(
        `Presupuesto insuficiente en "${dept.NombreDepartamento}". ` +
          `Presupuesto: Q${presupuesto.toFixed(2)}, Usado: Q${usado.toFixed(2)}, Disponible: Q${disponible.toFixed(2)}. ` +
          `El salario ingresado (Q${salarioNuevo.toFixed(2)}) supera el monto disponible.`,
      );
    }
  }

  async create(createSalarioDto: CreateSalarioDto) {
    const { IdEmpleado, SalarioBase, FechaInicioVigencia, FechaFinVigencia } =
      createSalarioDto;

    // Verificar que el empleado existe
    const empleado = await this.prismaService.empleado.findUnique({
      where: { IdEmpleado: Number(IdEmpleado) },
    });

    if (!empleado) {
      throw new NotFoundException(
        `Empleado con ID ${IdEmpleado} no encontrado`,
      );
    }

    // Verificar presupuesto del departamento si el empleado tiene uno asignado
    if (empleado.IdDepartamento) {
      await this.verificarPresupuestoDepartamento(
        empleado.IdDepartamento,
        Number(IdEmpleado),
        Number(SalarioBase),
      );
    }

    // Desactivar salarios anteriores
    await this.prismaService.salario.updateMany({
      where: { IdEmpleado: Number(IdEmpleado), Activo: true },
      data: { Activo: false, FechaFinVigencia: new Date() },
    });

    const nuevoSalario = await this.prismaService.salario.create({
      data: {
        IdEmpleado: Number(IdEmpleado),
        SalarioBase: Number(SalarioBase),
        FechaInicioVigencia: new Date(FechaInicioVigencia),
        FechaFinVigencia: FechaFinVigencia ? new Date(FechaFinVigencia) : null,
        Activo: true,
      },
    });

    return {
      message: 'Salario registrado correctamente',
      id: nuevoSalario.IdHistorico,
    };
  }

  async findAll() {
    const salarios = await this.prismaService.salario.findMany({
      include: {
        Empleado: {
          select: {
            IdEmpleado: true,
            Nombres: true,
            Apellidos: true,
          },
        },
      },
      orderBy: { FechaInicioVigencia: 'desc' },
    });

    return salarios.map((s) => ({
      ...s,
      NombreEmpleado: `${s.Empleado.Nombres} ${s.Empleado.Apellidos}`.trim(),
      SalarioBase: Number(s.SalarioBase),
      FechaInicioVigencia: s.FechaInicioVigencia
        ? s.FechaInicioVigencia.toISOString().slice(0, 10)
        : null,
      FechaFinVigencia: s.FechaFinVigencia
        ? s.FechaFinVigencia.toISOString().slice(0, 10)
        : null,
    }));
  }

  async findByEmpleado(idEmpleado: number) {
    const salarios = await this.prismaService.salario.findMany({
      where: { IdEmpleado: Number(idEmpleado) },
      orderBy: { FechaInicioVigencia: 'desc' },
    });

    return salarios.map((s) => ({
      ...s,
      SalarioBase: Number(s.SalarioBase),
      FechaInicioVigencia: s.FechaInicioVigencia
        ? s.FechaInicioVigencia.toISOString().slice(0, 10)
        : null,
      FechaFinVigencia: s.FechaFinVigencia
        ? s.FechaFinVigencia.toISOString().slice(0, 10)
        : null,
    }));
  }

  async findOne(id: number) {
    const salario = await this.prismaService.salario.findUnique({
      where: { IdHistorico: id },
      include: {
        Empleado: {
          select: {
            IdEmpleado: true,
            Nombres: true,
            Apellidos: true,
          },
        },
      },
    });

    if (!salario) {
      throw new NotFoundException(`Salario con ID ${id} no encontrado`);
    }

    return {
      ...salario,
      NombreEmpleado:
        `${salario.Empleado.Nombres} ${salario.Empleado.Apellidos}`.trim(),
      SalarioBase: Number(salario.SalarioBase),
      FechaInicioVigencia: salario.FechaInicioVigencia
        ? salario.FechaInicioVigencia.toISOString().slice(0, 10)
        : null,
      FechaFinVigencia: salario.FechaFinVigencia
        ? salario.FechaFinVigencia.toISOString().slice(0, 10)
        : null,
    };
  }

  async update(id: number, updateSalarioDto: UpdateSalarioDto) {
    await this.findOne(id);

    const { SalarioBase, FechaInicioVigencia, FechaFinVigencia, Activo } =
      updateSalarioDto;

    const salarioActualizado = await this.prismaService.salario.update({
      where: { IdHistorico: id },
      data: {
        ...(SalarioBase && { SalarioBase: Number(SalarioBase) }),
        ...(FechaInicioVigencia && {
          FechaInicioVigencia: new Date(FechaInicioVigencia),
        }),
        ...(FechaFinVigencia !== undefined && {
          FechaFinVigencia: FechaFinVigencia
            ? new Date(FechaFinVigencia)
            : null,
        }),
        ...(Activo !== undefined && { Activo }),
      },
    });

    return {
      message: 'Salario actualizado correctamente',
      id: salarioActualizado.IdHistorico,
    };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prismaService.salario.update({
      where: { IdHistorico: id },
      data: {
        Activo: false,
        FechaFinVigencia: new Date(),
      },
    });

    return {
      message: 'Salario eliminado correctamente',
      id,
    };
  }

  async getSalarioActivo(idEmpleado: number) {
    const salario = await this.prismaService.salario.findFirst({
      where: { IdEmpleado: Number(idEmpleado), Activo: true },
      orderBy: { FechaInicioVigencia: 'desc' },
    });

    if (!salario) {
      return null;
    }

    return {
      ...salario,
      SalarioBase: Number(salario.SalarioBase),
      FechaInicioVigencia: salario.FechaInicioVigencia
        ? salario.FechaInicioVigencia.toISOString().slice(0, 10)
        : null,
      FechaFinVigencia: salario.FechaFinVigencia
        ? salario.FechaFinVigencia.toISOString().slice(0, 10)
        : null,
    };
  }
}
