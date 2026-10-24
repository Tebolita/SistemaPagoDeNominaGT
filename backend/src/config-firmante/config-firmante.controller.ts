import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ConfigFirmanteService, CreateConfigFirmanteDto } from './config-firmante.service';
import { AuthGuard } from '../login/login.guard';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@Controller('config-firmante')
@UseGuards(AuthGuard)
export class ConfigFirmanteController {
  constructor(private readonly service: ConfigFirmanteService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Roles(...ROLES_RRHH)
  @Post()
  create(@Body() dto: CreateConfigFirmanteDto) { return this.service.create(dto); }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateConfigFirmanteDto>) {
    return this.service.update(id, dto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
