import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ControlVacacionService } from './control-vacacion.service';
import { CreateControlVacacionDto } from './dto/create-control-vacacion.dto';
import { UpdateControlVacacionDto } from './dto/update-control-vacacion.dto';
import { AuthGuard } from 'src/login/login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('control-vacacion')
export class ControlVacacionController {
  constructor(private readonly controlVacacionService: ControlVacacionService) {}

  @Post('CrearControlVacacion')
  create(@Body() createControlVacacionDto: CreateControlVacacionDto) {
    return this.controlVacacionService.create(createControlVacacionDto);
  }

  @Get()
  findAll() {
    return this.controlVacacionService.findAll();
  }

  // Ruta extra para obtener las bolsas de vacaciones de un empleado
  @Get('empleado/:idEmpleado')
  findByEmpleado(@Param('idEmpleado') idEmpleado: string) {
    return this.controlVacacionService.findByEmpleado(+idEmpleado);
  }

  @Get(':idControlVacacion')
  findOne(@Param('idControlVacacion') idControlVacacion: string) {
    return this.controlVacacionService.findOne(+idControlVacacion);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateControlVacacionDto: UpdateControlVacacionDto) {
    return this.controlVacacionService.update(+id, updateControlVacacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.controlVacacionService.remove(+id);
  }
}