import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstadoNominaDto } from './dto/create-estado-nomina.dto';
import { UpdateEstadoNominaDto } from './dto/update-estado-nomina.dto';
import { CambiarEstadoNominaDto } from './dto/cambiar-estado-nomina.dto';

@Injectable()
export class EstadoNominaService {
  constructor(private prisma: PrismaService) {}

  // CRUD básico para estados
  async create(createEstadoNominaDto: CreateEstadoNominaDto) {
    return this.prisma.estadoNomina.create({
      data: createEstadoNominaDto,
    });
  }

  async findAll() {
    return this.prisma.estadoNomina.findMany({
      where: { Activo: true },
      orderBy: { Orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const estado = await this.prisma.estadoNomina.findUnique({
      where: { IdEstadoNomina: id },
    });
    if (!estado) {
      throw new NotFoundException(`Estado de nómina con ID ${id} no encontrado`);
    }
    return estado;
  }

  async update(id: number, updateEstadoNominaDto: UpdateEstadoNominaDto) {
    await this.findOne(id); // Verificar que existe
    return this.prisma.estadoNomina.update({
      where: { IdEstadoNomina: id },
      data: updateEstadoNominaDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verificar que existe
    return this.prisma.estadoNomina.update({
      where: { IdEstadoNomina: id },
      data: { Activo: false },
    });
  }

  // Métodos específicos para flujo de estados
  async cambiarEstadoNomina(cambiarEstadoDto: CambiarEstadoNominaDto, idUsuario: number) {
    const { IdNomina, IdEstadoNuevo, Comentarios } = cambiarEstadoDto;

    // Verificar que la nómina existe
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina: IdNomina },
      include: { EstadoNomina: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${IdNomina} no encontrada`);
    }

    // Verificar que el estado nuevo existe
    const estadoNuevo = await this.findOne(IdEstadoNuevo);

    // Verificar si la transición es válida (lógica básica)
    if (nomina.IdEstadoActual && !this.esTransicionValida(nomina.IdEstadoActual, IdEstadoNuevo)) {
      throw new BadRequestException('Transición de estado no permitida');
    }

    // Crear historial del cambio de estado
    await this.prisma.historialEstadoNomina.create({
      data: {
        IdNomina,
        IdEstadoAnterior: nomina.IdEstadoActual,
        IdEstadoNuevo,
        IdUsuarioCambio: idUsuario,
        FechaCambio: new Date(),
        Comentarios,
      },
    });

    // Actualizar el estado de la nómina
    return this.prisma.nominaEncabezado.update({
      where: { IdNomina },
      data: { IdEstadoActual: IdEstadoNuevo },
      include: {
        EstadoNomina: true,
      },
    });
  }

  // Obtener historial de estados de una nómina
  async getHistorialEstados(IdNomina: number) {
    return this.prisma.historialEstadoNomina.findMany({
      where: { IdNomina },
      include: {
        EstadoNomina_HistorialEstadoNomina_IdEstadoAnteriorToEstadoNomina: {
          select: { NombreEstado: true },
        },
        EstadoNomina_HistorialEstadoNomina_IdEstadoNuevoToEstadoNomina: {
          select: { NombreEstado: true },
        },
        Usuario: {
          select: { Username: true },
        },
      },
      orderBy: { FechaCambio: 'desc' },
    });
  }

  // Obtener estados disponibles para una nómina específica
  async getEstadosDisponibles(IdNomina: number) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina },
      select: { IdEstadoActual: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${IdNomina} no encontrada`);
    }

    // Lógica básica: devolver todos los estados activos
    // En una implementación más compleja, se filtrarían según el estado actual
    return this.findAll();
  }

  // Método privado para validar transiciones de estado
  private esTransicionValida(idEstadoActual: number, idEstadoNuevo: number): boolean {
    // Lógica básica de validación de transiciones
    // En producción, esto podría ser más complejo con un grafo de estados
    const transicionesPermitidas: Record<number, number[]> = {
      1: [2], // GENERADA -> PENDIENTE_APROBACION
      2: [3, 4], // PENDIENTE_APROBACION -> APROBADA, RECHAZADA
      3: [5], // APROBADA -> PROCESADA
      4: [1], // RECHAZADA -> GENERADA (para corregir)
      5: [], // PROCESADA -> ningún cambio permitido
    };

    return transicionesPermitidas[idEstadoActual]?.includes(idEstadoNuevo) ?? false;
  }
}
