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
} from '@nestjs/common';
import { NominaService } from './nomina.service';
import { CreateNominaDto } from './dto/create-nomina.dto';
import { UpdateNominaDto } from './dto/update-nomina.dto';
import { AuthGuard } from '../login/login.guard';

@Controller('nomina')
@UseGuards(AuthGuard)
export class NominaController {
  constructor(private readonly nominaService: NominaService) {}

  @Post()
  create(@Request() req: any, @Body() createNominaDto: CreateNominaDto) {
    return this.nominaService.create(createNominaDto, req.user?.sub);
  }

  @Post('calcular')
  calcular(@Body() body: { idEmpleado: number; salarioBase: number }) {
    return this.nominaService.calcularNomina(body.idEmpleado, body.salarioBase);
  }

  @Post('generar')
  generarNomina(
    @Request() req: any,
    @Body() body: { idEmpleado: number; salarioBase: number; mes?: number; anio?: number },
  ) {
    return this.nominaService.crearNominaConDetalles(
      body.idEmpleado,
      body.salarioBase,
      req.user?.sub,
      body.mes,
      body.anio,
    );
  }

  @Post('generar-masiva')
  generarNominaMasiva(
    @Request() req: any,
    @Body() body: { mes?: number; anio?: number },
  ) {
    return this.nominaService.generarNominaMasiva(req.user?.sub, body.mes, body.anio);
  }

  @Get('parametros')
  getParametros() {
    return this.nominaService.getParametros();
  }

  @Get()
  findAll() {
    return this.nominaService.findAll();
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
}
