import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Injectable()
export class DepartamentoService {
  constructor(private prismaService: PrismaService) {}

  create(createDepartamentoDto: CreateDepartamentoDto) {
    return this.prismaService.departamento.create({
      data: createDepartamentoDto,
    });
  }

  findAll() {
    return this.prismaService.departamento.findMany({
      where: { Activo: true },
      include: {
        Puesto: true,
      },
    });
  }

  findOne(id: number) {
    return this.prismaService.departamento.findUnique({
      where: { IdDepartamento: id },
      include: {
        Puesto: true,
      },
    });
  }

  update(id: number, updateDepartamentoDto: UpdateDepartamentoDto) {
    return this.prismaService.departamento.update({
      where: { IdDepartamento: id },
      data: updateDepartamentoDto,
    });
  }

  remove(id: number) {
    return this.prismaService.departamento.update({
      where: { IdDepartamento: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}
