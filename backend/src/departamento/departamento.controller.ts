import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { DepartamentoService } from './departamento.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { AuthGuard } from '../login/login.guard';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@Controller('departamento')
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Roles(...ROLES_RRHH)
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createDepartamentoDto: CreateDepartamentoDto) {
    return this.departamentoService.create(createDepartamentoDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.departamentoService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.departamentoService.findOne(+id);
  }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDepartamentoDto: UpdateDepartamentoDto,
  ) {
    return this.departamentoService.update(+id, updateDepartamentoDto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.departamentoService.remove(+id);
  }
}
