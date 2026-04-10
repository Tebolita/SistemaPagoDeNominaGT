import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsuarioService {

  constructor(private prismaService: PrismaService) {}

  // Buscamos al usuario especifico SOLO por username
  async findOne(username: string) {
    
    const userFound = await this.prismaService.usuario.findFirst({
      where: {
        Username: username // Buscamos únicamente por el nombre de usuario
      },
      select: {
        Username: true,
        Contrasena: true, // Necesitamos traer esto para compararlo después
        Clave: true,      // Necesitamos traer esto para compararlo después
        IdUsuario: true,
        RolUsuario: {
          select: {
            NombreRol: true
          }
        }
      }
    });

    return userFound;
  }


  async create(createUsuarioDto: CreateUsuarioDto) {
      const nuevoEmpleado = await this.prismaService.usuario.create({
        data: {...createUsuarioDto, 
          Contrasena:  await bcryptjs.hash(createUsuarioDto.Contrasena, 12),
          Clave: await bcryptjs.hash(createUsuarioDto.Clave, 12),}
      })
      return {message: `Se creo el usuario.`};
  }  
}
