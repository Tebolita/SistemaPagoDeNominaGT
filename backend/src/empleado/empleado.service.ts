import { Injectable } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmpleadoService {
  constructor(
    private prismaService: PrismaService
  ) {}

  async create(createEmpleadoDto: CreateEmpleadoDto) {
      
      const { IdPuesto, IdJornada, Estado, ...dataToCreate } = createEmpleadoDto as any;

      const nuevoEmpleado = await this.prismaService.empleado.create({
        data: {
          ...dataToCreate,
         
          ...(Estado !== undefined && { Activo: Estado }),
            
          ...(IdPuesto && { Puesto: { connect: { IdPuesto: Number(IdPuesto) } } }),

          ...(IdJornada && { JornadaLaboral: {connect: {IdJornada: Number(IdJornada)}}})
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
        Usuario: { select: { IdUsuario: true, IdRol: true, RolUsuario: { select: { NombreRol: true } } } },
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
        Usuario: { select: { IdUsuario: true, IdRol: true, RolUsuario: { select: { NombreRol: true } } } },
        Puesto: { select: { NombrePuesto: true } },
        JornadaLaboral: { select: { NombreJornada: true } },
        Banco: { select: { NombreBanco: true } }
      }
    });
    
    return empleado;
  }

  async update(id: number, updateEmpleadoDto: UpdateEmpleadoDto) {
      await this.findOne(id);

      const { IdEmpleado, IdPuesto, Estado, IdRol, ...dataToUpdate } = updateEmpleadoDto as any;

      const empleadoActualizado = await this.prismaService.empleado.update({
        where: { IdEmpleado: id },
        data: {
          ...dataToUpdate,
          
          ...(Estado !== undefined && { Activo: Estado }),
          
          ...(IdPuesto && { Puesto: { connect: { IdPuesto: Number(IdPuesto) } } })
        },
      });

      return {
        message: `Empleado actualizado correctamente.`,
        id: empleadoActualizado.IdEmpleado,
      };
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