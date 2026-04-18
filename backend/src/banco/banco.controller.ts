import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BancoService } from './banco.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';
import { AuthGuard } from '../login/login.guard';

@Controller('banco')
export class BancoController {
  constructor(private readonly bancoService: BancoService) {}

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

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateBancoDto: UpdateBancoDto) {
    return this.bancoService.update(+id, updateBancoDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.bancoService.remove(+id);
  }
}
