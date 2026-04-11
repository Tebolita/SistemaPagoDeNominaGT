import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class IncidenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIncidenciaDto: CreateIncidenciaDto) {
    return await this.prisma.incidencia.create({
      data: createIncidenciaDto,
    });
  }

  async findAll() {
    return await this.prisma.incidencia.findMany({
      include: { 
        Empleado: true,
        Usuario: true // Para ver quién autorizó
      },
    });
  }

  async findOne(id: number) {
    const incidencia = await this.prisma.incidencia.findUnique({
      where: { IdIncidencia: id },
    });
    if (!incidencia) throw new NotFoundException(`Incidencia #${id} no encontrada`);
    return incidencia;
  }

  async update(id: number, updateIncidenciaDto: UpdateIncidenciaDto) {
    await this.findOne(id);

    // Usamos "as any" por si el DTO no tiene declaradas estas propiedades relacionales
    const { 
        IdIncidencia, 
        Empleado, 
        Usuario, 
        ...dataToUpdate 
    } = updateIncidenciaDto as any;

    // Pasamos a Prisma solo el dataToUpdate limpio
    return await this.prisma.incidencia.update({
        where: {
            IdIncidencia: id
        },
        data: dataToUpdate 
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prisma.incidencia.delete({
      where: { IdIncidencia: id },
    });
  }
}