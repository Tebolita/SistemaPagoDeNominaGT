import { Controller, Post, Body, UseGuards, Get, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from 'src/login/login.guard';
import { UsuarioService } from './usuario.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Crear usuario (Normalmente público para registrarse, o protegido si lo crea el Admin)
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
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUsuarioDto: UpdateUsuarioDto
  ) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  // Eliminar un usuario (Protegido con Token)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.remove(id);
  }
}