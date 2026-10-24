import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, Put, UseGuards, Request } from '@nestjs/common';
import { VentaService } from './venta.service';
import { CreateVentaDto, UpdateVentaDto } from './dto/venta.dto';
import { leerPaginacion } from 'src/common/paginacion';
import { AuthGuard } from '../login/login.guard';
import { Roles, ROLES_VENTAS_FINANZAS } from 'src/common/roles';
import type { RequestConUsuario } from 'src/common/request-con-usuario';

@Roles(...ROLES_VENTAS_FINANZAS)
@Controller('venta')
@UseGuards(AuthGuard)
export class VentaController {
  constructor(private readonly ventaService: VentaService) {}

  @Post()
  create(@Request() req: RequestConUsuario, @Body() createVentaDto: CreateVentaDto) {
    return this.ventaService.create(createVentaDto, req.user?.sub ?? 1);
  }

  @Get()
  findAll(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('idCliente') idCliente?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const clienteId = idCliente ? parseInt(idCliente) : undefined;
    return this.ventaService.findAll(
      fechaInicio, fechaFin, estadoPago, clienteId, leerPaginacion(page, limit),
    );
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
    @Request() req: RequestConUsuario,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estadoPago: string; IdCuenta?: number },
  ) {
    return this.ventaService.updateEstadoPago(id, body.estadoPago, body.IdCuenta, req.user?.sub ?? 1);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ventaService.remove(id);
  }
}
