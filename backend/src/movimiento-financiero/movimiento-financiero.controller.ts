import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, Request } from '@nestjs/common';
import type { RequestConUsuario } from 'src/common/request-con-usuario';
import { MovimientoFinancieroService } from './movimiento-financiero.service';
import { leerPaginacion } from 'src/common/paginacion';
import { CreateMovimientoFinancieroDto, UpdateMovimientoFinancieroDto } from './dto/movimiento-financiero.dto';
import { Roles, ROLES_VENTAS_FINANZAS } from 'src/common/roles';

@Roles(...ROLES_VENTAS_FINANZAS)
@Controller('movimiento-financiero')
export class MovimientoFinancieroController {
  constructor(private readonly movimientoService: MovimientoFinancieroService) {}

  @Post()
  create(@Request() req: RequestConUsuario, @Body() createMovimientoDto: CreateMovimientoFinancieroDto) {
    // El usuario que registra sale del JWT, no del cuerpo de la petición
    return this.movimientoService.create({ ...createMovimientoDto, IdUsuarioRegistra: req.user!.sub });
  }

  @Get()
  findAll(
    @Query('idCuenta') idCuenta?: string,
    @Query('tipoMovimiento') tipoMovimiento?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('activo') activo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const idCuentaNum = idCuenta ? parseInt(idCuenta) : undefined;
    const activoBoolean = activo ? activo === 'true' : undefined;
    return this.movimientoService.findAll(
      idCuentaNum, tipoMovimiento, fechaInicio, fechaFin, activoBoolean, leerPaginacion(page, limit),
    );
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
