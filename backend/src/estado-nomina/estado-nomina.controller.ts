import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { EstadoNominaService } from './estado-nomina.service';
import { CreateEstadoNominaDto } from './dto/create-estado-nomina.dto';
import { UpdateEstadoNominaDto } from './dto/update-estado-nomina.dto';
import { CambiarEstadoNominaDto } from './dto/cambiar-estado-nomina.dto';
import { AuthGuard } from '../login/login.guard';

@Controller('estado-nomina')
@UseGuards(AuthGuard)
export class EstadoNominaController {
  constructor(private readonly estadoNominaService: EstadoNominaService) {}

  // CRUD básico para estados
  @Post()
  create(@Body() createEstadoNominaDto: CreateEstadoNominaDto) {
    return this.estadoNominaService.create(createEstadoNominaDto);
  }

  @Get()
  findAll() {
    return this.estadoNominaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.estadoNominaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoNominaDto: UpdateEstadoNominaDto,
  ) {
    return this.estadoNominaService.update(id, updateEstadoNominaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.estadoNominaService.remove(id);
  }

  // Endpoints específicos para flujo de estados
  @Post('cambiar-estado')
  cambiarEstadoNomina(
    @Request() req: any,
    @Body() cambiarEstadoDto: CambiarEstadoNominaDto,
  ) {
    const idUsuario = req.user?.sub;
    const userRole = req.user?.role;
    if (!idUsuario) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return this.estadoNominaService.cambiarEstadoNomina(
      cambiarEstadoDto,
      idUsuario,
      userRole,
    );
  }

  @Get('historial/:idNomina')
  getHistorialEstados(@Param('idNomina', ParseIntPipe) idNomina: number) {
    return this.estadoNominaService.getHistorialEstados(idNomina);
  }

  @Get('disponibles/:idNomina')
  getEstadosDisponibles(
    @Request() req: any,
    @Param('idNomina', ParseIntPipe) idNomina: number,
  ) {
    const role = req.user?.role;
    return this.estadoNominaService.getEstadosDisponibles(idNomina, role);
  }
}
