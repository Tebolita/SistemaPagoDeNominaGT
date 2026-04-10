import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsuarioService {

  constructor(private prismaService: PrismaService) {}

  // Buscamos al usuario especifico por usuario y password
  async findOne(username: string, contrasena: string, clave: number) {
    const hashedContrasena = await bcryptjs.hash(contrasena, 10);
    const hashedClave = await bcryptjs.hash(clave.toString(), 10);
    const userFound = await this.prismaService.usuario.findFirst({
      where: {
          Username: username, Contrasena: hashedContrasena, Clave: hashedClave
      },
      select: {
        Username: true,
        Contrasena: true,
        Clave: true,
        IdUsuario: true,
        RolUsuario: {
          select: {
            NombreRol: true
          }
        }
      }
    })

    return userFound;
  }


  async create(createUsuarioDto: CreateUsuarioDto) {
      const nuevoEmpleado = await this.prismaService.usuario.create({
        data: createUsuarioDto
      })
      return {message: `Se creo el usuario.`};
  }  
}
