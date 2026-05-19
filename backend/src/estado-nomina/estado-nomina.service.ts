import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
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
      data: {
        ...createEstadoNominaDto,
        Activo: createEstadoNominaDto.Activo ?? true,
        RequiereAprobacion: createEstadoNominaDto.RequiereAprobacion ?? false,
      },
    });
  }

  async findAll() {
    return this.prisma.estadoNomina.findMany({
      where: { OR: [{ Activo: true }, { Activo: null }] },
      orderBy: { Orden: 'asc' },
    });
  }

  async findOne(id: number) {
    const estado = await this.prisma.estadoNomina.findUnique({
      where: { IdEstadoNomina: id },
    });
    if (!estado) {
      throw new NotFoundException(
        `Estado de nómina con ID ${id} no encontrado`,
      );
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
  async cambiarEstadoNomina(
    cambiarEstadoDto: CambiarEstadoNominaDto,
    idUsuario: number,
    userRole?: string,
  ) {
    const { IdNomina, IdEstadoNuevo, Comentarios, NumeroBoleta } = cambiarEstadoDto;

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

    // Verificar permisos de rol para el estado de aprobación
    if (!this.puedeCambiarAEstado(estadoNuevo, userRole)) {
      throw new ForbiddenException(
        'No tiene permisos para cambiar al estado solicitado',
      );
    }

    // Verificar si la transición es válida
    const estadoActualNombre = nomina.EstadoNomina?.NombreEstado;
    if (estadoActualNombre && !this.esTransicionValida(estadoActualNombre, estadoNuevo.NombreEstado)) {
      throw new BadRequestException('Transición de estado no permitida');
    }

    // Al marcar como PAGADO, el número de boleta/transacción es obligatorio
    if (estadoNuevo.NombreEstado === 'PAGADO' && !NumeroBoleta?.trim()) {
      throw new BadRequestException(
        'El número de boleta o transacción es requerido para registrar el pago',
      );
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

    // Actualizar el estado de la nómina (y boleta si aplica)
    const updateData: any = {
      IdEstadoActual: IdEstadoNuevo,
      Estado: estadoNuevo.NombreEstado,
    };
    if (NumeroBoleta?.trim()) {
      updateData.NumeroBoleta = NumeroBoleta.trim();
    }

    return this.prisma.nominaEncabezado.update({
      where: { IdNomina },
      data: updateData,
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
  async getEstadosDisponibles(IdNomina: number, userRole?: string) {
    const nomina = await this.prisma.nominaEncabezado.findUnique({
      where: { IdNomina },
      include: { EstadoNomina: true },
    });

    if (!nomina) {
      throw new NotFoundException(`Nómina con ID ${IdNomina} no encontrada`);
    }

    const estadoActual = nomina.EstadoNomina?.NombreEstado;

    if (!estadoActual) {
      const estados = await this.findAll();
      return estados.filter((estado) => this.puedeCambiarAEstado(estado, userRole));
    }

    const nombresDisponibles = this.transicionesDesde(estadoActual);
    if (nombresDisponibles.length === 0) return [];

    const estados = await this.prisma.estadoNomina.findMany({
      where: { Activo: true, NombreEstado: { in: nombresDisponibles } },
      orderBy: { Orden: 'asc' },
    });

    return estados.filter((estado) => this.puedeCambiarAEstado(estado, userRole));
  }

  private puedeCambiarAEstado(
    estado: any,
    userRole?: string,
  ): boolean {
    if (!estado.RequiereAprobacion) {
      return true;
    }

    if (!userRole) {
      return false;
    }

    const normalizedRole = userRole.trim().toUpperCase().replace(/\s+/g, '_');
    const rolesPermitidos = [
      'ADMINISTRADOR',
      'ADMIN',
      'GERENTE',
      'RRHH',
      'RECURSOS_HUMANOS',
      'RECURSOS HUMANOS',
    ];

    return rolesPermitidos.includes(normalizedRole);
  }

  private transicionesDesde(nombreEstado: string): string[] {
    const mapa: Record<string, string[]> = {
      BORRADOR: ['PENDIENTE_APROBACION'],
      PENDIENTE_APROBACION: ['APROBADO', 'CANCELADO'],
      APROBADO: ['PAGADO'],
      PAGADO: [],
      CANCELADO: [],
    };
    return mapa[nombreEstado] ?? [];
  }

  private esTransicionValida(nombreActual: string, nombreNuevo: string): boolean {
    return this.transicionesDesde(nombreActual).includes(nombreNuevo);
  }
}
