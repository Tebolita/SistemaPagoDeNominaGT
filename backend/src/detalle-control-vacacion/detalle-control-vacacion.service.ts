import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDetalleControlVacacionDto } from './dto/create-detalle-control-vacacion.dto';
import { UpdateDetalleControlVacacionDto } from './dto/update-detalle-control-vacacion.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DetalleControlVacacionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDetalleDto: CreateDetalleControlVacacionDto) {
    return await this.prisma.detalleControlVacacion.create({
      data: createDetalleDto,
    });
  }

  async findAll() {
    return await this.prisma.detalleControlVacacion.findMany();
  }

  async findOne(id: number) {
    const detalle = await this.prisma.detalleControlVacacion.findUnique({
      where: { IdDetalleVacacion: id },
    });
    if (!detalle) throw new NotFoundException(`Detalle #${id} no encontrado`);
    return detalle;
  }

  // --- FUNCIONES EXTRA RECOMENDADAS ---
  
  // Ver qué incidencias han consumido días de un año específico
  async findByControl(idControlVacacion: number) {
    return await this.prisma.detalleControlVacacion.findMany({
      where: { IdControlVacacion: idControlVacacion },
      include: { Incidencia: true }
    });
  }

  // Ver de qué años se descontaron los días de una incidencia específica
  async findByIncidencia(idIncidencia: number) {
    return await this.prisma.detalleControlVacacion.findMany({
      where: { IdIncidencia: idIncidencia },
      include: { ControlVacacion: true }
    });
  }

  async update(id: number, updateDetalleDto: UpdateDetalleControlVacacionDto) {
    await this.findOne(id);
    return await this.prisma.detalleControlVacacion.update({
      where: { IdDetalleVacacion: id },
      data: updateDetalleDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.detalleControlVacacion.delete({
      where: { IdDetalleVacacion: id },
    });
  }
}