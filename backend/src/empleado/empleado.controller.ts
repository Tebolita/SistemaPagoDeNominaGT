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
import { EmpleadoService } from './empleado.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { UpdateEmpleadoDto } from './dto/update-empleado.dto';
import { AuthGuard } from 'src/login/login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('empleado')
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

  @Roles(...ROLES_RRHH)
  @Post('CrearEmpleado')
  create(@Body() createEmpleadoDto: CreateEmpleadoDto) {
    return this.empleadoService.create(createEmpleadoDto);
  }

  @Get()
  findAll() {
    return this.empleadoService.findAll();
  }

  @Get(':idEmpleado')
  findOne(@Param('idEmpleado') idEmpleado: string) {
    return this.empleadoService.findOne(+idEmpleado);
  }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmpleadoDto: UpdateEmpleadoDto,
  ) {
    return this.empleadoService.update(+id, updateEmpleadoDto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.empleadoService.remove(id);
  }
}
