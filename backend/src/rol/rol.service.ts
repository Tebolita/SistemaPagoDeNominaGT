import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  constructor(private prisma: PrismaService) {}

  async create(createRolDto: CreateRolDto) {
    return await this.prisma.rolUsuario.create({
      data: {
        NombreRol: createRolDto.NombreRol,
        Activo: true, 
      },
    });
  }

  async findAll() {
    return await this.prisma.rolUsuario.findMany();
  }

  async findOne(id: number) {
    const rol = await this.prisma.rolUsuario.findFirst({
      where: {
        IdRol: id
      },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado o fue eliminado`);
    }

    return rol;
  }

  async update(id: number, updateRolDto: UpdateRolDto) {
    // Verificamos que exista antes de actualizar
    await this.findOne(id);

    return await this.prisma.rolUsuario.update({
      where: { IdRol: id },
      data: {
        ...updateRolDto,
      },
    });
  }

  async remove(id: number) {
    const rol = await this.findOne(id);
    return await this.prisma.rolUsuario.update({
      where: { IdRol: id },
      data: {
        Activo: !rol.Activo,
        FechaEliminacion: new Date(),
      },
    });
  }
}