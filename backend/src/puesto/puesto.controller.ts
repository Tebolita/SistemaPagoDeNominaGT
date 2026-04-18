import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PuestoService } from './puesto.service';
import { CreatePuestoDto } from './dto/create-puesto.dto';
import { UpdatePuestoDto } from './dto/update-puesto.dto';
import { AuthGuard } from '../login/login.guard';

@Controller('puesto')
export class PuestoController {
  constructor(private readonly puestoService: PuestoService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createPuestoDto: CreatePuestoDto) {
    return this.puestoService.create(createPuestoDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.puestoService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.puestoService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updatePuestoDto: UpdatePuestoDto) {
    return this.puestoService.update(+id, updatePuestoDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.puestoService.remove(+id);
  }
}
