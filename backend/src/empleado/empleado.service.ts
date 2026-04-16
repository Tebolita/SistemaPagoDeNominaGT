import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmpleadoService {
  constructor(private prismaService: PrismaService) {}

  async create(createEmpleadoDto: CreateEmpleadoDto) {
    const nuevoEmpleado = await this.prismaService.empleado.create({
      data: createEmpleadoDto as any,
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
      // 1. Solo traemos los activos (Borrado lógico)
      where: { Activo: true }, 
      include: {
        Usuario: { select: { RolUsuario: { select: { NombreRol: true } } } },
        Puesto: { select: { NombrePuesto: true } },
        JornadaLaboral: { select: { NombreJornada: true } },
        Banco: { select: { NombreBanco: true } } 
      },
    });

    return empleados.map((emp) => ({
      ...emp,
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
        Puesto: { select: { NombrePuesto: true } },
        JornadaLaboral: { select: { NombreJornada: true } },
        Banco: { select: { NombreBanco: true } }
      }
    });

    // 4. Manejo de excepciones si el empleado no existe o ya fue eliminado (borrado lógico)
    if (!empleado || !empleado.Activo) {
      throw new NotFoundException(`El empleado con ID ${idEmpleado} no existe o ha sido dado de baja.`);
    }
    
    return empleado;
  }

  async update(id: number, updateEmpleadoDto: UpdateEmpleadoDto) {
    // Verificamos que exista y esté activo
    await this.findOne(id);

    const { IdEmpleado, ...dataToUpdate } = updateEmpleadoDto as any;

    return await this.prismaService.empleado.update({
      where: { IdEmpleado: id },
      data: dataToUpdate,
    });
  }

  async remove(id: number) {
    // Verificamos que exista
    await this.findOne(id);

    // Aplicamos el borrado lógico en lugar de eliminar la fila físicamente
    return await this.prismaService.empleado.update({
      where: { IdEmpleado: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}