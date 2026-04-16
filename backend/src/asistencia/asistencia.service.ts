import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AsistenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAsistenciaDto: CreateAsistenciaDto) {
    return await this.prisma.asistencia.create({
      data: createAsistenciaDto,
    });
  }

  async findAll() {
    return await this.prisma.asistencia.findMany({
      include: { Empleado: true }, // Útil para ver el nombre del empleado
    });
  }

  async findOne(id: number) {
    const asistencia = await this.prisma.asistencia.findUnique({
      where: { IdAsistencia: id },
    });
    if (!asistencia) throw new NotFoundException(`Asistencia #${id} no encontrada`);
    return asistencia;
  }

  async update(id: number, updateAsistenciaDto: UpdateAsistenciaDto) {
      // Verificamos que exista
      await this.findOne(id);

      // Extraemos el IdAsistencia para que no entre en el "data"
      const { IdAsistencia, Empleado, ...dataToUpdate } = updateAsistenciaDto as any;

      // Actualizamos
      return await this.prisma.asistencia.update({
          where: {
              IdAsistencia: id
          },
          data: dataToUpdate 
      });
  }

  async remove(id: number) {
    const asistenciaActual = await this.findOne(id);
    return await this.prisma.asistencia.update({
      where: { IdAsistencia: id },
      data: {
        Activo: !asistenciaActual.Activo,
        FechaEliminacion: new Date()
      }
    });
  }
}