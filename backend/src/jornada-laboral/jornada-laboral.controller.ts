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
import { JornadaLaboralService } from './jornada-laboral.service';
import { CreateJornadaLaboralDto } from './dto/create-jornada-laboral.dto';
import { UpdateJornadaLaboralDto } from './dto/update-jornada-laboral.dto';
import { AuthGuard } from '../login/login.guard';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@Controller('jornada-laboral')
export class JornadaLaboralController {
  constructor(private readonly jornadaLaboralService: JornadaLaboralService) {}

  @Roles(...ROLES_RRHH)
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createJornadaLaboralDto: CreateJornadaLaboralDto) {
    return this.jornadaLaboralService.create(createJornadaLaboralDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.jornadaLaboralService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.jornadaLaboralService.findOne(+id);
  }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateJornadaLaboralDto: UpdateJornadaLaboralDto,
  ) {
    return this.jornadaLaboralService.update(+id, updateJornadaLaboralDto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.jornadaLaboralService.remove(+id);
  }
}
