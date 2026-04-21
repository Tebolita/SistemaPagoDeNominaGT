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
  create(@Body() createNominaDto: CreateNominaDto) {
    return this.nominaService.create(createNominaDto);
  }

  @Post('calcular')
  calcular(@Body() body: { idEmpleado: number; salarioBase: number }) {
    return this.nominaService.calcularNomina(body.idEmpleado, body.salarioBase);
  }

  @Post('generar')
  generarNomina(@Body() body: { idEmpleado: number; salarioBase: number }) {
    return this.nominaService.crearNominaConDetalles(
      body.idEmpleado,
      body.salarioBase,
    );
  }

  @Post('generar-masiva')
  generarNominaMasiva() {
    return this.nominaService.generarNominaMasiva();
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
