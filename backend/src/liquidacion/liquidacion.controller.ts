import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LiquidacionService, CalcularLiquidacionDto } from './liquidacion.service';
import { AuthGuard } from 'src/login/login.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@ApiTags('Liquidación')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('liquidacion')
export class LiquidacionController {
  constructor(private readonly svc: LiquidacionService) {}

  @Roles(...ROLES_RRHH)
  @Post('calcular')
  calcular(@Body() dto: CalcularLiquidacionDto) { return this.svc.calcular(dto); }

  @Roles(...ROLES_RRHH)
  @Post()
  crear(@Body() dto: CalcularLiquidacionDto) { return this.svc.crear(dto); }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Roles(...ROLES_RRHH)
  @Patch(':id/pagar')
  pagar(@Param('id', ParseIntPipe) id: number) { return this.svc.pagar(id); }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
