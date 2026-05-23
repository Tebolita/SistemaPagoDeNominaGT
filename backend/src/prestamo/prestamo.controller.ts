import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { PrestamoService, CreatePrestamoDto } from './prestamo.service';
import { AuthGuard } from 'src/login/login.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Préstamos')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('prestamo')
export class PrestamoController {
  constructor(private readonly svc: PrestamoService) {}

  @Post()
  create(@Body() dto: CreatePrestamoDto) { return this.svc.create(dto); }

  @Get()
  findAll(@Query('idEmpleado') idEmpleado?: string) {
    return this.svc.findAll(idEmpleado ? parseInt(idEmpleado) : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Patch('cuota/:idCuota/pagar')
  pagarCuota(@Param('idCuota', ParseIntPipe) idCuota: number) { return this.svc.pagarCuota(idCuota); }

  @Delete(':id')
  cancelar(@Param('id', ParseIntPipe) id: number) { return this.svc.cancelar(id); }
}
