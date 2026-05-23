import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LiquidacionService, CalcularLiquidacionDto } from './liquidacion.service';
import { AuthGuard } from 'src/login/login.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Liquidación')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('liquidacion')
export class LiquidacionController {
  constructor(private readonly svc: LiquidacionService) {}

  @Post('calcular')
  calcular(@Body() dto: CalcularLiquidacionDto) { return this.svc.calcular(dto); }

  @Post()
  crear(@Body() dto: CalcularLiquidacionDto) { return this.svc.crear(dto); }

  @Get()
  findAll() { return this.svc.findAll(); }

  @Patch(':id/pagar')
  pagar(@Param('id', ParseIntPipe) id: number) { return this.svc.pagar(id); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
