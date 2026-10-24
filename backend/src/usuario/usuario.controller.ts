import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from 'src/login/login.guard';
import { UsuarioService } from './usuario.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles, ROLES_RRHH, ROLES_SEGURIDAD, tieneRol } from 'src/common/roles';
import type { RequestConUsuario } from 'src/common/request-con-usuario';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Crear usuario (Normalmente público para registrarse, o protegido si lo crea el Admin)
  @Roles(...ROLES_SEGURIDAD)
  @Post('CrearUsuario')
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }

  // Ver todos los usuarios (Protegido con Token)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('VerUsuarios')
  findAll() {
    return this.usuarioService.findAll();
  }

  // Ver un usuario específico por ID (Protegido con Token)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findById(id);
  }

  // Actualizar un usuario (Protegido con Token)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  // Seguridad edita todo; RRHH solo puede reasignar el rol desde la ficha del empleado
  // (sin tocar cuentas de administrador ni otorgar roles de administrador).
  @Roles(...ROLES_RRHH)
  @Patch(':id')
  async update(
    @Request() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    if (!tieneRol(req.user?.role, ROLES_SEGURIDAD)) {
      await this.usuarioService.validarCambioDeRolPorRrhh(id, updateUsuarioDto);
    }
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  // Cada usuario cambia su propia contraseña; solo un administrador puede cambiar la de otro
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id/cambiar-password')
  cambiarPassword(
    @Request() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { passwordActual: string; passwordNueva: string; claveNueva?: string },
  ) {
    if (req.user?.sub !== id && !tieneRol(req.user?.role, ROLES_SEGURIDAD)) {
      throw new ForbiddenException('Solo puedes cambiar tu propia contraseña');
    }
    return this.usuarioService.cambiarPassword(id, body.passwordActual, body.passwordNueva, body.claveNueva);
  }

  // Eliminar un usuario (Protegido con Token)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(...ROLES_SEGURIDAD)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}
