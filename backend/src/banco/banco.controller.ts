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
import { BancoService } from './banco.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';
import { AuthGuard } from '../login/login.guard';
import { Roles, ROLES_RRHH } from 'src/common/roles';

@Controller('banco')
export class BancoController {
  constructor(private readonly bancoService: BancoService) {}

  @Roles(...ROLES_RRHH)
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createBancoDto: CreateBancoDto) {
    return this.bancoService.create(createBancoDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.bancoService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.bancoService.findOne(+id);
  }

  @Roles(...ROLES_RRHH)
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateBancoDto: UpdateBancoDto) {
    return this.bancoService.update(+id, updateBancoDto);
  }

  @Roles(...ROLES_RRHH)
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.bancoService.remove(+id);
  }
}
