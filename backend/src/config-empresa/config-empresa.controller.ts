import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfigEmpresaService, UpsertConfigEmpresaDto } from './config-empresa.service';
import { AuthGuard } from 'src/login/login.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@ApiTags('Config Empresa')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('config-empresa')
export class ConfigEmpresaController {
  constructor(private readonly svc: ConfigEmpresaService) {}

  @Get()
  get() { return this.svc.get(); }

  @Roles(...ROLES_RRHH)
  @Put()
  upsert(@Body() dto: UpsertConfigEmpresaDto) { return this.svc.upsert(dto); }
}
