import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { MovimientoFinancieroService } from './movimiento-financiero.service';
import { CreateMovimientoFinancieroDto, UpdateMovimientoFinancieroDto } from './dto/movimiento-financiero.dto';

@Controller('movimiento-financiero')
export class MovimientoFinancieroController {
  constructor(private readonly movimientoService: MovimientoFinancieroService) {}

  @Post()
  create(@Body() createMovimientoDto: CreateMovimientoFinancieroDto) {
    return this.movimientoService.create(createMovimientoDto);
  }

  @Get()
  findAll(
    @Query('idCuenta') idCuenta?: string,
    @Query('tipoMovimiento') tipoMovimiento?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('activo') activo?: string,
  ) {
    const idCuentaNum = idCuenta ? parseInt(idCuenta) : undefined;
    const activoBoolean = activo ? activo === 'true' : undefined;
    return this.movimientoService.findAll(idCuentaNum, tipoMovimiento, fechaInicio, fechaFin, activoBoolean);
  }

  @Get('balance/:idCuenta')
  getBalance(@Param('idCuenta', ParseIntPipe) idCuenta: number) {
    return this.movimientoService.getBalancePorCuenta(idCuenta);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMovimientoDto: UpdateMovimientoFinancieroDto) {
    return this.movimientoService.update(id, updateMovimientoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.movimientoService.remove(id);
  }
}
