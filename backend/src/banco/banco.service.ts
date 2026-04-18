import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBancoDto } from './dto/create-banco.dto';
import { UpdateBancoDto } from './dto/update-banco.dto';

@Injectable()
export class BancoService {
  constructor(private prismaService: PrismaService) {}

  create(createBancoDto: CreateBancoDto) {
    return this.prismaService.banco.create({
      data: createBancoDto,
    });
  }

  findAll() {
    return this.prismaService.banco.findMany({
      where: { Activo: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.banco.findUnique({
      where: { IdBanco: id },
    });
  }

  update(id: number, updateBancoDto: UpdateBancoDto) {
    return this.prismaService.banco.update({
      where: { IdBanco: id },
      data: updateBancoDto,
    });
  }

  remove(id: number) {
    return this.prismaService.banco.update({
      where: { IdBanco: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}
