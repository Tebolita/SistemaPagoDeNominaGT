import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { AuthGuard } from 'src/login/login.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, ROLES_SEGURIDAD } from 'src/common/roles';

@ApiTags('Auditoría')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles(...ROLES_SEGURIDAD)
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  findAll(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('accion')     accion?: string,
    @Query('username')   username?: string,
    @Query('exitoso')    exitoso?: string,
    @Query('page')       page?: number,
    @Query('limit')      limit?: number,
  ) {
    return this.auditoriaService.findAll({ fechaDesde, fechaHasta, accion, username, exitoso, page, limit });
  }

  @Get('resumen')
  getResumen() {
    return this.auditoriaService.getResumen();
  }
}
