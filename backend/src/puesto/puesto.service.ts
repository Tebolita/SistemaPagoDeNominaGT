import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePuestoDto } from './dto/create-puesto.dto';
import { UpdatePuestoDto } from './dto/update-puesto.dto';

@Injectable()
export class PuestoService {
  constructor(private prismaService: PrismaService) {}

  create(createPuestoDto: CreatePuestoDto) {
    return this.prismaService.puesto.create({
      data: createPuestoDto,
    });
  }

  findAll() {
    return this.prismaService.puesto.findMany({
      where: { Activo: true },
      include: {
        Departamento: true,
      },
    });
  }

  findOne(id: number) {
    return this.prismaService.puesto.findUnique({
      where: { IdPuesto: id },
      include: {
        Departamento: true,
      },
    });
  }

  update(id: number, updatePuestoDto: UpdatePuestoDto) {
    return this.prismaService.puesto.update({
      where: { IdPuesto: id },
      data: updatePuestoDto,
    });
  }

  remove(id: number) {
    return this.prismaService.puesto.update({
      where: { IdPuesto: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}
