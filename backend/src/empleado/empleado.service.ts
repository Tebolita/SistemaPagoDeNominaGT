import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmpleadoService {
  constructor(private prismaService: PrismaService) {}

  async create(createEmpleadoDto: CreateEmpleadoDto) {
    const {
      IdPuesto,
      IdJornada,
      IdBanco,
      CuentaBancaria,
      Estado,
      ...dataToCreate
    } = createEmpleadoDto as any;

    const nuevoEmpleado = await this.prismaService.empleado.create({
      data: {
        ...dataToCreate,

        ...(Estado !== undefined && { Activo: Estado }),

        ...(IdPuesto && {
          Puesto: { connect: { IdPuesto: Number(IdPuesto) } },
        }),

        ...(IdJornada && {
          JornadaLaboral: { connect: { IdJornada: Number(IdJornada) } },
        }),
        ...(IdBanco && { Banco: { connect: { IdBanco: Number(IdBanco) } } }),
        ...(CuentaBancaria !== undefined && { CuentaBancaria }),
      },
      select: {
        Nombres: true,
        IdEmpleado: true,
      },
    });

    return {
      message: `Se creó el empleado ${nuevoEmpleado.Nombres} correctamente.`,
      id: nuevoEmpleado.IdEmpleado,
    };
  }

  async findAll() {
    const empleados = await this.prismaService.empleado.findMany({
      include: {
        Usuario: {
          select: {
            IdUsuario: true,
            IdRol: true,
            RolUsuario: { select: { NombreRol: true } },
          },
        },
        Puesto: { select: { NombrePuesto: true } },
        JornadaLaboral: { select: { IdJornada: true, NombreJornada: true } },
        Banco: { select: { IdBanco: true, NombreBanco: true } },
        Departamento: { select: { NombreDepartamento: true } },
      },
    });

    return empleados.map((emp) => ({
      ...emp,
      NombreCompleto: `${emp.Nombres} ${emp.Apellidos}`.trim(),
      FechaEliminacion: emp.FechaEliminacion
        ? emp.FechaEliminacion.toISOString().slice(0, 19).replace('T', ' ')
        : null,
      FechaIngresa: emp.FechaIngresa
        ? emp.FechaIngresa.toISOString().slice(0, 19).replace('T', ' ')
        : null,
    }));
  }

  async findOne(idEmpleado: number) {
    const empleado = await this.prismaService.empleado.findUnique({
      where: { IdEmpleado: idEmpleado },
      include: {
        Usuario: {
          select: {
            IdUsuario: true,
            IdRol: true,
            RolUsuario: { select: { NombreRol: true } },
          },
        },
        Puesto: { select: { NombrePuesto: true } },
        JornadaLaboral: { select: { IdJornada: true, NombreJornada: true } },
        Banco: { select: { IdBanco: true, NombreBanco: true } },
      },
    });

    return empleado;
  }

  async update(id: number, updateEmpleadoDto: UpdateEmpleadoDto) {
    const empleadoActual = await this.findOne(id);

    const {
      IdEmpleado,
      IdPuesto,
      IdJornada,
      IdBanco,
      IdDepartamento,
      CuentaBancaria,
      Estado,
      IdRol,
      ...dataToUpdate
    } = updateEmpleadoDto as any;

    // Si se está cambiando o asignando departamento, verificar presupuesto
    if (IdDepartamento && IdDepartamento !== empleadoActual?.IdDepartamento) {
      const salarioActivo = await this.prismaService.salario.findFirst({
        where: { IdEmpleado: id, NOT: { Activo: false } },
        orderBy: { FechaInicioVigencia: 'desc' },
        select: { SalarioBase: true },
      });
      const salario = salarioActivo ? parseFloat(salarioActivo.SalarioBase.toString()) : 0;
      await this.verificarPresupuestoDepartamento(IdDepartamento, salario, id);
    }

    const empleadoActualizado = await this.prismaService.empleado.update({
      where: { IdEmpleado: id },
      data: {
        ...dataToUpdate,

        ...(Estado !== undefined && { Activo: Estado }),

        ...(IdPuesto && {
          Puesto: { connect: { IdPuesto: Number(IdPuesto) } },
        }),
        ...(IdJornada && {
          JornadaLaboral: { connect: { IdJornada: Number(IdJornada) } },
        }),
        ...(IdBanco && { Banco: { connect: { IdBanco: Number(IdBanco) } } }),
        ...(IdDepartamento
          ? { Departamento: { connect: { IdDepartamento: Number(IdDepartamento) } } }
          : IdDepartamento === null
            ? { Departamento: { disconnect: true } }
            : {}),
        ...(CuentaBancaria !== undefined && { CuentaBancaria }),
      },
    });

    return {
      message: `Empleado actualizado correctamente.`,
      id: empleadoActualizado.IdEmpleado,
    };
  }

  private async verificarPresupuestoDepartamento(
    idDepartamento: number,
    salarioNuevo: number,
    excludeIdEmpleado?: number,
  ): Promise<void> {
    const dept = await this.prismaService.departamento.findUnique({
      where: { IdDepartamento: idDepartamento },
      select: { Presupuesto: true, NombreDepartamento: true },
    });

    if (!dept || dept.Presupuesto === null) return;

    const presupuesto = parseFloat(dept.Presupuesto.toString());

    const empleados = await this.prismaService.empleado.findMany({
      where: {
        IdDepartamento: idDepartamento,
        NOT: { Activo: false },
        ...(excludeIdEmpleado ? { IdEmpleado: { not: excludeIdEmpleado } } : {}),
      },
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
        `El departamento "${dept.NombreDepartamento}" no tiene presupuesto suficiente. ` +
          `Presupuesto: Q${presupuesto.toFixed(2)}, Usado: Q${usado.toFixed(2)}, Disponible: Q${disponible.toFixed(2)}.`,
      );
    }
  }

  async remove(id: number) {
    const empelado = await this.findOne(id);

    const empleadoEliminado = await this.prismaService.empleado.update({
      where: { IdEmpleado: id },
      data: {
        Activo: !empelado?.Activo,
        FechaEliminacion: new Date(),
      },
    });

    return {
      message: `Empleado eliminado correctamente.`,
      id: empleadoEliminado.IdEmpleado,
    };
  }
}
