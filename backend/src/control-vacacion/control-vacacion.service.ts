import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateControlVacacionDto } from './dto/create-control-vacacion.dto';
import { UpdateControlVacacionDto } from './dto/update-control-vacacion.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ControlVacacionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createControlVacacionDto: CreateControlVacacionDto) {
    return await this.prisma.controlVacacion.create({
      data: createControlVacacionDto,
    });
  }

  async findAll() {
    return await this.prisma.controlVacacion.findMany();
  }

  async findOne(id: number) {
    const control = await this.prisma.controlVacacion.findUnique({
      where: { IdControlVacacion: id },
    });
    if (!control) throw new NotFoundException(`Control de vacaciones #${id} no encontrado`);
    return control;
  }

  // --- FUNCIÓN EXTRA RECOMENDADA ---
  // Obtiene los saldos de vacaciones de un empleado específico
  async findByEmpleado(idEmpleado: number) {
    return await this.prisma.controlVacacion.findMany({
      where: { IdEmpleado: idEmpleado },
      orderBy: { AnioCorriente: 'asc' } // Ordenado por año (PEPS: Primeras entradas, primeras salidas)
    });
  }

  async update(id: number, updateControlVacacionDto: UpdateControlVacacionDto) {
    await this.findOne(id);
    return await this.prisma.controlVacacion.update({
      where: { IdControlVacacion: id },
      data: updateControlVacacionDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.controlVacacion.delete({
      where: { IdControlVacacion: id },
    });
  }
}