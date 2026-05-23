import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { NominaService } from './nomina.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { UpdateNominaDto } from './dto/update-nomina.dto';
import { AuthGuard } from '../login/login.guard';
import { ExportService } from '../export/export.service';

@Controller('nomina')
@UseGuards(AuthGuard)
export class NominaController {
  constructor(
    private readonly nominaService: NominaService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  create(@Request() req: any, @Body() createNominaDto: CreateNominaDto) {
    return this.nominaService.create(createNominaDto, req.user?.sub);
  }

  @Post('calcular')
  calcular(@Body() body: { idEmpleado: number; salarioBase: number; mes?: number; anio?: number }) {
    return this.nominaService.calcularNomina(body.idEmpleado, body.salarioBase, body.mes, body.anio);
  }

  @Post('generar')
  generarNomina(
    @Request() req: any,
    @Body() body: { idEmpleado: number; salarioBase: number; mes?: number; anio?: number; idCuenta?: number },
  ) {
    return this.nominaService.crearNominaConDetalles(
      body.idEmpleado,
      body.salarioBase,
      req.user?.sub,
      body.mes,
      body.anio,
      body.idCuenta,
    );
  }

  @Post('generar-personalizada')
  generarPersonalizada(
    @Request() req: any,
    @Body() body: {
      idEmpleados: number[];
      idParametros: number[];
      mes?: number;
      anio?: number;
      idCuenta?: number;
      incluirSalarioBase?: boolean;
    },
  ) {
    return this.nominaService.crearNominaPersonalizada(
      body.idEmpleados,
      body.idParametros,
      req.user?.sub,
      body.mes,
      body.anio,
      body.idCuenta,
      body.incluirSalarioBase ?? true,
    );
  }

  @Post('generar-masiva')
  generarNominaMasiva(
    @Request() req: any,
    @Body() body: { mes?: number; anio?: number; idCuenta?: number },
  ) {
    return this.nominaService.generarNominaMasiva(req.user?.sub, body.mes, body.anio, body.idCuenta);
  }

  @Get('parametros')
  getParametros() {
    return this.nominaService.getParametros();
  }

  @Get()
  findAll() {
    return this.nominaService.findAll();
  }

  @Get('eliminadas')
  findEliminadas() {
    return this.nominaService.findEliminadas();
  }

  @Get(':id/firmantes-asignados')
  getFirmantesAsignados(@Param('id', ParseIntPipe) id: number) {
    return this.nominaService.getAsignacionesFirmantes(id);
  }

  @Post(':id/firmantes-asignados')
  asignarFirmantes(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { asignaciones: any[] },
  ) {
    return this.nominaService.asignarFirmantesNomina(id, body.asignaciones, req.user?.sub);
  }

  @Patch(':id/restaurar')
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.nominaService.restaurar(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nominaService.findOne(id);
  }

  @Get(':id/firmas')
  getFirmas(@Param('id', ParseIntPipe) id: number) {
    return this.nominaService.getFirmas(id);
  }

  @Post(':id/firmar')
  firmarNomina(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { tipoFirmante: string; comentarios?: string },
  ) {
    return this.nominaService.firmarNomina(
      id,
      body.tipoFirmante,
      req.user?.sub,
      body.comentarios,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNominaDto: UpdateNominaDto,
  ) {
    return this.nominaService.update(id, updateNominaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nominaService.remove(id);
  }

  // ─── Exportaciones Excel por institución ─────────────────────────

  @Get(':id/export/general')
  async exportGeneral(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const nomina = await this.nominaService.findOne(id);
    return this.exportService.exportNominaGeneral(nomina, res);
  }

  @Get(':id/export/igss')
  async exportIGSS(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const nomina = await this.nominaService.findOne(id);
    return this.exportService.exportNominaIGSS(nomina, res);
  }

  @Get(':id/export/isr')
  async exportISR(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const nomina = await this.nominaService.findOne(id);
    return this.exportService.exportNominaISR(nomina, res);
  }
}
