import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsuarioService {
  constructor(private prismaService: PrismaService) {}

  // Usado para el Login
  async findOne(username: string) {
    const userFound = await this.prismaService.usuario.findFirst({
      where: { Username: username },
      select: {
        Username: true,
        Contrasena: true, 
        Clave: true,      
        IdUsuario: true,
        RolUsuario: { select: { NombreRol: true } }
      }
    });
    return userFound;
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const nuevoUsuario = await this.prismaService.usuario.create({
      data: {
        ...createUsuarioDto, 
        Contrasena: await bcryptjs.hash(createUsuarioDto.Contrasena, 12),
        Clave: await bcryptjs.hash(createUsuarioDto.Clave, 12),
      }
    });
    return {
      message: `Se creó el usuario ${nuevoUsuario.Username} correctamente.`,
      id: nuevoUsuario.IdUsuario,
    };
  }  

  // Obtener todos los usuarios (Sin contraseñas)
  async findAll() {
    return await this.prismaService.usuario.findMany({
      select: {
        IdUsuario: true,
        Username: true,
        IdRol: true,
        IdEmpleado: true,
        RolUsuario: { select: { NombreRol: true } },
        // Si tienes la relación con Empleado en tu schema, puedes descomentar esto:
        Empleado: { select: { Nombres: true, Apellidos: true } }
      }
    });
  }

  // NUEVO: Obtener un usuario por ID
  async findById(id: number) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: { IdUsuario: id },
      select: {
        IdUsuario: true,
        Username: true,
        Activo: true,
        IdRol: true,
        IdEmpleado: true,
        RolUsuario: { select: { NombreRol: true } }
      }
    });

    if (!usuario) {
      throw new NotFoundException(`El usuario con ID ${id} no existe.`);
    }

    return usuario;
  }

  // Actualizar un usuario
  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    // Validamos que exista
    await this.findById(id);

    const dataToUpdate = { ...updateUsuarioDto };

    // Si mandaron una nueva contraseña, la encriptamos antes de guardar
    if (dataToUpdate.Contrasena) {
      dataToUpdate.Contrasena = await bcryptjs.hash(dataToUpdate.Contrasena, 12);
    }
    
    // Si mandaron una nueva clave, la encriptamos antes de guardar
    if (dataToUpdate.Clave) {
      dataToUpdate.Clave = await bcryptjs.hash(dataToUpdate.Clave, 12);
    }

    // Quitamos propiedades que no deben ir en el update de Prisma
    const { IdUsuario, ...rest } = dataToUpdate as any;

    const usuarioActualizado = await this.prismaService.usuario.update({
      where: { IdUsuario: id },
      data: rest,
    });

    return {
      message: `Usuario actualizado correctamente.`,
      id: usuarioActualizado.IdUsuario,
    };
  }

  // Eliminar un usuario
  async remove(id: number) {
    // Validamos que exista
    const usuario = await this.findById(id);

    const usuarioEliminado = await this.prismaService.usuario.update({
      where: { IdUsuario: id },
      data: { Activo: !usuario.Activo }
    });

    return {
      message: `Usuario eliminado correctamente.`,
      id: usuarioEliminado.IdUsuario,
    };
  }
}