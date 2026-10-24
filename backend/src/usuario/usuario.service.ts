import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ROLES_SEGURIDAD, tieneRol } from 'src/common/roles';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CorreoService } from '../correo/correo.service';
import * as bcryptjs from 'bcryptjs';
import { esContrasenaSegura, MENSAJE_CONTRASENA } from 'src/common/politica-contrasena';

@Injectable()
export class UsuarioService {
  private readonly logger = new Logger(UsuarioService.name);

  constructor(
    private prismaService: PrismaService,
    private correoService: CorreoService,
  ) {}

  // Usado para el Login
  async findOne(username: string) {
    const userFound = await this.prismaService.usuario.findFirst({
      where: { Username: username },
      select: {
        Username: true,
        Contrasena: true,
        Clave: true,
        IdUsuario: true,
        Activo: true,
        RolUsuario: { select: { NombreRol: true } },
      },
    });
    return userFound;
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const plainPassword = createUsuarioDto.Contrasena;

    const nuevoUsuario = await this.prismaService.usuario.create({
      data: {
        ...createUsuarioDto,
        Contrasena: await bcryptjs.hash(createUsuarioDto.Contrasena, 12),
        Clave: await bcryptjs.hash(createUsuarioDto.Clave, 12),
        Activo: true,
      },
    });

    // Enviar credenciales por correo (no bloquea la respuesta si falla)
    this.correoService
      .enviarCredencialesUsuario(createUsuarioDto.Username, plainPassword, createUsuarioDto.IdEmpleado)
      .catch(err => this.logger.warn(`Correo de credenciales no enviado: ${err?.message}`));

    return {
      message: `Se creó el usuario ${nuevoUsuario.Username} correctamente.`,
      id: nuevoUsuario.IdUsuario,
    };
  }

  // Obtener todos los usuarios (Sin contraseñas)
  async findAll() {
    return await this.prismaService.usuario.findMany({
      // Los usuarios dados de baja no se listan (Activo null se considera activo)
      where: { NOT: { Activo: false } },
      select: {
        IdUsuario: true,
        Username: true,
        IdRol: true,
        IdEmpleado: true,
        RolUsuario: { select: { NombreRol: true } },
        // Si tienes la relación con Empleado en tu schema, puedes descomentar esto:
        Empleado: { select: { Nombres: true, Apellidos: true } },
      },
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
        RolUsuario: { select: { NombreRol: true } },
        Empleado: { select: { Nombres: true, Apellidos: true } },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`El usuario con ID ${id} no existe.`);
    }

    return usuario;
  }

  /**
   * Un usuario sin rol de Seguridad (RRHH) solo puede cambiar el rol de una cuenta, nunca el de
   * un administrador ni asignar un rol de administrador (evita la escalada de privilegios).
   */
  async validarCambioDeRolPorRrhh(id: number, cambios: UpdateUsuarioDto) {
    const campos = Object.entries(cambios)
      .filter(([, v]) => v !== undefined)
      .map(([k]) => k);
    if (campos.some((c) => c !== 'IdRol')) {
      throw new ForbiddenException('Solo Seguridad puede modificar datos de acceso del usuario');
    }
    const actual = await this.findById(id);
    if (tieneRol(actual.RolUsuario?.NombreRol, ROLES_SEGURIDAD)) {
      throw new ForbiddenException('No puedes modificar una cuenta de administrador');
    }
    if (cambios.IdRol !== undefined) {
      const nuevo = await this.prismaService.rolUsuario.findUnique({
        where: { IdRol: cambios.IdRol },
        select: { NombreRol: true },
      });
      if (!nuevo) throw new NotFoundException(`El rol con ID ${cambios.IdRol} no existe.`);
      if (tieneRol(nuevo.NombreRol, ROLES_SEGURIDAD)) {
        throw new ForbiddenException('Solo Seguridad puede asignar el rol de administrador');
      }
    }
  }

  // Actualizar un usuario
  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    // Validamos que exista
    await this.findById(id);

    const dataToUpdate = { ...updateUsuarioDto };

    // Si mandaron una nueva contraseña, la encriptamos antes de guardar
    if (dataToUpdate.Contrasena) {
      dataToUpdate.Contrasena = await bcryptjs.hash(
        dataToUpdate.Contrasena,
        12,
      );
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

  async cambiarPassword(id: number, passwordActual: string, passwordNueva: string, claveNueva?: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: { IdUsuario: id },
      select: { Contrasena: true, Clave: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (!esContrasenaSegura(passwordNueva)) throw new BadRequestException(MENSAJE_CONTRASENA);

    const valido = await bcryptjs.compare(passwordActual, usuario.Contrasena);
    if (!valido) throw new UnauthorizedException('La contraseña actual es incorrecta');

    const data: any = { Contrasena: await bcryptjs.hash(passwordNueva, 12) };
    if (claveNueva) data.Clave = await bcryptjs.hash(claveNueva, 12);

    await this.prismaService.usuario.update({ where: { IdUsuario: id }, data });
    return { message: 'Contraseña actualizada correctamente' };
  }

  // Eliminar un usuario
  async remove(id: number) {
    // Validamos que exista
    await this.findById(id);

    // Baja lógica explícita: repetir la operación no reactiva al usuario
    const usuarioEliminado = await this.prismaService.usuario.update({
      where: { IdUsuario: id },
      data: { Activo: false, FechaEliminacion: new Date() },
    });

    return {
      message: `Usuario eliminado correctamente.`,
      id: usuarioEliminado.IdUsuario,
    };
  }
}
