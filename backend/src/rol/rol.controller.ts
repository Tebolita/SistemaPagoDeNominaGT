import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/login/login.guard';
import { Roles, ROLES_SEGURIDAD } from 'src/common/roles';

// Catálogo de roles: cualquier usuario autenticado lo lee (RRHH lo usa en Empleados);
// crear, editar o borrar roles es exclusivo de Seguridad.
@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('roles')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Roles(...ROLES_SEGURIDAD)
  @Post()
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.create(createRolDto);
  }

  @Get()
  findAll() {
    return this.rolService.findAll();
  }

  // Catálogo de todos los permisos agrupados por módulo — debe ir antes de :id
  @Get('permisos')
  getPermisos() {
    return this.rolService.getPermisos();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolService.findOne(id);
  }

  @Get(':id/permisos')
  getPermisosRol(@Param('id', ParseIntPipe) id: number) {
    return this.rolService.getPermisosRol(id);
  }

  @Roles(...ROLES_SEGURIDAD)
  @Put(':id/permisos')
  asignarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { idPermisos: number[] },
  ) {
    return this.rolService.asignarPermisos(id, body.idPermisos);
  }

  @Roles(...ROLES_SEGURIDAD)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolDto: UpdateRolDto,
  ) {
    return this.rolService.update(id, updateRolDto);
  }

  @Roles(...ROLES_SEGURIDAD)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolService.remove(id);
  }
}
