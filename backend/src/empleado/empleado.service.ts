import { Injectable } from '@nestjs/common';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmpleadoService {
  constructor (private prismaService: PrismaService) {}

  async create(createEmpleadoDto: CreateEmpleadoDto) {
    const nuevoEmpleado = await this.prismaService.empleado.create({
      data: createEmpleadoDto,
      select: {
        Nombres: true,
        IdEmpleado: true
      }
    })
    return {message: `Se creo el empleado ${nuevoEmpleado.Nombres} correctamente.`, id:nuevoEmpleado.IdEmpleado};
  }

  async findAll() {
    const empleados = await this.prismaService.empleado.findMany({
        include: {
            Usuario: { select: { RolUsuario: { select: { NombreRol: true } } } },
            Puesto: { select: { NombrePuesto: true } }
        }
    });

    return empleados.map(emp => ({
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
    const empleado = await this.prismaService.empleado.findFirst({
      where: {IdEmpleado: idEmpleado}
    })
    return empleado
  }

  async update(id: number, updateEmpleadoDto: UpdateEmpleadoDto) {
    const updateEmpleado = await this.prismaService.empleado.update({
      data: updateEmpleadoDto,
      where: {IdEmpleado: id}
    })
    return {message: `Se actualizo el empleado ${updateEmpleado.Nombres} correctamente.`};
  }

}
