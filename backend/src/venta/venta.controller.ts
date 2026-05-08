import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, Put } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto, UpdateVentaDto } from './dto/venta.dto';
import { Request } from 'express';

// Decorador personalizado para obtener el usuario del JWT
// Por ahora usaremos un usuario fijo para testing
@Controller('venta')
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  @Post()
  create(@Body() createVentaDto: CreateVentaDto) {
    // TODO: Obtener ID del usuario del JWT token
    const idUsuario = 1; // Usuario por defecto para testing
    return this.ventaService.create(createVentaDto, idUsuario);
  }

  @Get()
  findAll(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('idCliente') idCliente?: string,
  ) {
    const clienteId = idCliente ? parseInt(idCliente) : undefined;
    return this.ventaService.findAll(fechaInicio, fechaFin, estadoPago, clienteId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVentaDto: UpdateVentaDto) {
    return this.ventaService.update(id, updateVentaDto);
  }

  @Put(':id/estado-pago')
  updateEstadoPago(
    @Param('id', ParseIntPipe) id: number,
    @Body('estadoPago') estadoPago: string,
  ) {
    return this.ventaService.updateEstadoPago(id, estadoPago);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ventaService.remove(id);
  }
}