import {
  Query,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { leerPaginacion } from 'src/common/paginacion';

import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { AuthGuard } from 'src/login/login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('asistencia')
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Roles(...ROLES_RRHH)
  @Post('CrearAsistencia')
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciaService.create(createAsistenciaDto);
  }

  // ?page=1&limit=50 devuelve { total, page, limit, registros }; sin page, el arreglo completo
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.asistenciaService.findAll(leerPaginacion(page, limit));
  }

  @Get(':idAsistencia')
  findOne(@Param('idAsistencia') idAsistencia: string) {
    return this.asistenciaService.findOne(+idAsistencia);
  }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAsistenciaDto: UpdateAsistenciaDto,
  ) {
    return this.asistenciaService.update(+id, updateAsistenciaDto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.asistenciaService.remove(+id);
  }
}
