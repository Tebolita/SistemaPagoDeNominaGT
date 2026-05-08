import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { CuentaBancariaEmpresaService } from './cuenta-bancaria-empresa.service';
import { CreateCuentaBancariaEmpresaDto, UpdateCuentaBancariaEmpresaDto } from './dto/cuenta-bancaria-empresa.dto';

@Controller('cuenta-bancaria-empresa')
export class CuentaBancariaEmpresaController {
  constructor(private readonly cuentaService: CuentaBancariaEmpresaService) {}

  @Post()
  create(@Body() createCuentaDto: CreateCuentaBancariaEmpresaDto) {
    return this.cuentaService.create(createCuentaDto);
  }

  @Get()
  findAll(@Query('activo') activo?: string) {
    const activoBoolean = activo ? activo === 'true' : undefined;
    return this.cuentaService.findAll(activoBoolean);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cuentaService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCuentaDto: UpdateCuentaBancariaEmpresaDto) {
    return this.cuentaService.update(id, updateCuentaDto);
  }

  @Patch(':id/saldo')
  updateSaldo(@Param('id', ParseIntPipe) id: number, @Body('nuevoSaldo') nuevoSaldo: number) {
    return this.cuentaService.updateSaldo(id, nuevoSaldo);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cuentaService.remove(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id', ParseIntPipe) id: number) {
    return this.cuentaService.reactivate(id);
  }
}
