import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe,UseGuards } from '@nestjs/common';
import { SalarioService } from './salario.service';
import { CreateSalarioDto } from './dto/create-salario.dto';
import { UpdateSalarioDto } from './dto/update-salario.dto';
import { AuthGuard } from '../login/login.guard';

@Controller('salario')
@UseGuards(AuthGuard)
export class SalarioController {
  constructor(private readonly salarioService: SalarioService) {}

  @Post()
  create(@Body() createSalarioDto: CreateSalarioDto) {
    return this.salarioService.create(createSalarioDto);
  }

  @Get()
  findAll() {
    return this.salarioService.findAll();
  }

  @Get('empleado/:idEmpleado')
  findByEmpleado(@Param('idEmpleado', ParseIntPipe) idEmpleado: number) {
    return this.salarioService.findByEmpleado(idEmpleado);
  }

  @Get('activo/:idEmpleado')
  getSalarioActivo(@Param('idEmpleado', ParseIntPipe) idEmpleado: number) {
    return this.salarioService.getSalarioActivo(idEmpleado);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salarioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSalarioDto: UpdateSalarioDto) {
    return this.salarioService.update(id, updateSalarioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.salarioService.remove(id);
  }
}