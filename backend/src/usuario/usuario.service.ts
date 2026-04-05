import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsuarioService {

  constructor(private prismaService: PrismaService) {}

  // Buscamos al usuario especifico por usuario y password
  async findOne(username: string, contrasena: string, clave: number) {
    const userFound = await this.prismaService.usuario.findFirst({
      where: {
          Username: username, Contrasena: contrasena, Clave: clave!.toString()
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

}
