import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParametroGlobalDto } from './dto/create-parametro-global.dto';
import { UpdateParametroGlobalDto } from './dto/update-parametro-global.dto';

@Injectable()
export class ParametroGlobalService {
  constructor(private prismaService: PrismaService) {}

  create(createParametroGlobalDto: CreateParametroGlobalDto) {
    return this.prismaService.parametroGlobal.create({
      data: createParametroGlobalDto,
    });
  }

  findAll() {
    return this.prismaService.parametroGlobal.findMany({
      where: { Activo: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.parametroGlobal.findUnique({
      where: { IdParametro: id },
    });
  }

  findByName(nombre: string) {
    return this.prismaService.parametroGlobal.findFirst({
      where: { NombreParametro: nombre, Activo: true },
    });
  }

  update(id: number, updateParametroGlobalDto: UpdateParametroGlobalDto) {
    return this.prismaService.parametroGlobal.update({
      where: { IdParametro: id },
      data: updateParametroGlobalDto,
    });
  }

  remove(id: number) {
    return this.prismaService.parametroGlobal.update({
      where: { IdParametro: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}
