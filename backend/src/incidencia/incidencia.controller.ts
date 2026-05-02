import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { IncidenciaService } from './incidencia.service';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { AuthGuard } from 'src/login/login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('incidencia')
export class IncidenciaController {
  constructor(private readonly incidenciaService: IncidenciaService) {}

  @Post('CrearIncidencia')
  create(@Body() createIncidenciaDto: CreateIncidenciaDto) {
    return this.incidenciaService.create(createIncidenciaDto);
  }

  @Get()
  findAll() {
    return this.incidenciaService.findAll();
  }

  // Endpoint específico para obtener vacaciones con datos de ControlVacacion y DetalleControlVacacion
  @Get('vacaciones')
  findVacaciones() {
    return this.incidenciaService.findVacaciones();
  }

  @Get(':idIncidencia')
  findOne(@Param('idIncidencia') idIncidencia: string) {
    return this.incidenciaService.findOne(+idIncidencia);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidenciaDto: UpdateIncidenciaDto) {
    return this.incidenciaService.update(+id, updateIncidenciaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidenciaService.remove(+id);
  }
}