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
import { ParametroGlobalService } from './parametro-global.service';
import { CreateParametroGlobalDto } from './dto/create-parametro-global.dto';
import { UpdateParametroGlobalDto } from './dto/update-parametro-global.dto';
import { SimularParametroDto } from './dto/simular-parametro.dto';
import { AuthGuard } from '../login/login.guard';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@Controller('parametro-global')
export class ParametroGlobalController {
  constructor(
    private readonly parametroGlobalService: ParametroGlobalService,
  ) {}

  @Roles(...ROLES_RRHH)
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createParametroGlobalDto: CreateParametroGlobalDto) {
    return this.parametroGlobalService.create(createParametroGlobalDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.parametroGlobalService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.parametroGlobalService.findOne(+id);
  }

  @Get('nombre/:nombre')
  @UseGuards(AuthGuard)
  findByName(@Param('nombre') nombre: string) {
    return this.parametroGlobalService.findByName(nombre);
  }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateParametroGlobalDto: UpdateParametroGlobalDto,
  ) {
    return this.parametroGlobalService.update(+id, updateParametroGlobalDto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.parametroGlobalService.remove(+id);
  }

  @Post('simular')
  @UseGuards(AuthGuard)
  simular(@Body() dto: SimularParametroDto) {
    return this.parametroGlobalService.simular(dto);
  }
}
