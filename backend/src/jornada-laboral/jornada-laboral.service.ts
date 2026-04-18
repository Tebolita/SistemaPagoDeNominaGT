import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJornadaLaboralDto } from './dto/create-jornada-laboral.dto';
import { UpdateJornadaLaboralDto } from './dto/update-jornada-laboral.dto';

@Injectable()
export class JornadaLaboralService {
  constructor(private prismaService: PrismaService) {}

  create(createJornadaLaboralDto: CreateJornadaLaboralDto) {
    return this.prismaService.jornadaLaboral.create({
      data: createJornadaLaboralDto,
    });
  }

  findAll() {
    return this.prismaService.jornadaLaboral.findMany({
      where: { Activo: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.jornadaLaboral.findUnique({
      where: { IdJornada: id },
    });
  }

  update(id: number, updateJornadaLaboralDto: UpdateJornadaLaboralDto) {
    return this.prismaService.jornadaLaboral.update({
      where: { IdJornada: id },
      data: updateJornadaLaboralDto,
    });
  }

  remove(id: number) {
    return this.prismaService.jornadaLaboral.update({
      where: { IdJornada: id },
      data: {
        Activo: false,
        FechaEliminacion: new Date(),
      },
    });
  }
}
