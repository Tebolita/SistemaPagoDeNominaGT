import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DetalleControlVacacionService } from './detalle-control-vacacion.service';
import { CreateDetalleControlVacacionDto } from './dto/create-detalle-control-vacacion.dto';
import { UpdateDetalleControlVacacionDto } from './dto/update-detalle-control-vacacion.dto';
import { AuthGuard } from 'src/login/login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('detalle-control-vacacion')
export class DetalleControlVacacionController {
  constructor(private readonly detalleControlVacacionService: DetalleControlVacacionService) {}

  @Post('CrearDetalleControlVacacion')
  create(@Body() createDetalleControlVacacionDto: CreateDetalleControlVacacionDto) {
    return this.detalleControlVacacionService.create(createDetalleControlVacacionDto);
  }

  @Get()
  findAll() {
    return this.detalleControlVacacionService.findAll();
  }

  // Ruta extra para ver qué incidencias consumieron una bolsa específica
  @Get('control/:idControlVacacion')
  findByControl(@Param('idControlVacacion') idControlVacacion: string) {
    return this.detalleControlVacacionService.findByControl(+idControlVacacion);
  }

  // Ruta extra para ver de qué bolsas se cobró una ausencia específica
  @Get('incidencia/:idIncidencia')
  findByIncidencia(@Param('idIncidencia') idIncidencia: string) {
    return this.detalleControlVacacionService.findByIncidencia(+idIncidencia);
  }

  @Get(':idDetalleVacacion')
  findOne(@Param('idDetalleVacacion') idDetalleVacacion: string) {
    return this.detalleControlVacacionService.findOne(+idDetalleVacacion);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetalleControlVacacionDto: UpdateDetalleControlVacacionDto) {
    return this.detalleControlVacacionService.update(+id, updateDetalleControlVacacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detalleControlVacacionService.remove(+id);
  }
}