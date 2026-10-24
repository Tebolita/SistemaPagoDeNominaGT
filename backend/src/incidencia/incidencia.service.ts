import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  registrarDescuentoVacaciones,
  validarSolicitudVacaciones,
} from 'src/control-vacacion/saldo-vacaciones';

@Injectable()
export class IncidenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIncidenciaDto: CreateIncidenciaDto) {
    // Usamos transacción para crear la incidencia y el control de vacaciones
    return await this.prisma.$transaction(async (tx) => {
      // Vacaciones: validar fechas, traslapes y saldo antes de registrar
      const esVacacion = createIncidenciaDto.TipoIncidencia === 'Vacaciones';
      const dias = esVacacion
        ? await validarSolicitudVacaciones(
            tx,
            createIncidenciaDto.IdEmpleado,
            new Date(createIncidenciaDto.FechaInicio),
            new Date(createIncidenciaDto.FechaFin),
          )
        : 0;

      const incidencia = await tx.incidencia.create({
        data: { ...createIncidenciaDto, Activo: true },
      });

      if (esVacacion) {
        await registrarDescuentoVacaciones(
          tx,
          createIncidenciaDto.IdEmpleado,
          incidencia.IdIncidencia,
          dias,
        );
      }

      return incidencia;
    });
  }

  async findAll() {
    return await this.prisma.incidencia.findMany({
      include: {
        Empleado: true,
        Usuario: true, // Para ver quién autorizó
      },
    });
  }

  // Obtiene solo las incidencias de tipo Vacaciones con sus detalles de control
  async findVacaciones() {
    return await this.prisma.incidencia.findMany({
      where: {
        TipoIncidencia: 'Vacaciones',
        Activo: true,
      },
      include: {
        Empleado: {
          include: {
            Puesto: {
              include: {
                Departamento: true,
              },
            },
          },
        },
        Usuario: true,
        DetalleControlVacacion: {
          include: {
            ControlVacacion: true,
          },
        },
      },
      orderBy: { FechaInicio: 'desc' },
    });
  }

  async findOne(id: number) {
    const incidencia = await this.prisma.incidencia.findUnique({
      where: { IdIncidencia: id },
    });
    if (!incidencia)
      throw new NotFoundException(`Incidencia #${id} no encontrada`);
    return incidencia;
  }

  async update(id: number, updateIncidenciaDto: UpdateIncidenciaDto) {
    const incidenciaActual = await this.findOne(id);

    // Usamos transacción para actualizar la incidencia y el control de vacaciones
    return await this.prisma.$transaction(async (tx) => {
      // Extraer campos relacionales que no deben actualizarse directamente
      const {
        IdIncidencia,
        Empleado,
        Usuario,
        DetalleControlVacacion,
        ...dataToUpdate
      } = updateIncidenciaDto as any;

      // 1. Actualizar la incidencia
      const incidenciaActualizada = await tx.incidencia.update({
        where: { IdIncidencia: id },
        data: dataToUpdate,
      });

      // 2. Si es Vacaciones y cambiaron las fechas, revalidar y ajustar el descuento
      if (
        incidenciaActual.TipoIncidencia === 'Vacaciones' &&
        (dataToUpdate.FechaInicio || dataToUpdate.FechaFin)
      ) {
        const nuevosDiasDescontados = await validarSolicitudVacaciones(
          tx,
          incidenciaActual.IdEmpleado,
          new Date(incidenciaActualizada.FechaInicio),
          new Date(incidenciaActualizada.FechaFin),
          id,
        );

        const detalleActual = await tx.detalleControlVacacion.findFirst({
          where: { IdIncidencia: id, Activo: true },
        });

        if (detalleActual) {
          const diferenciaDias =
            nuevosDiasDescontados - Number(detalleActual.DiasDescontados || 0);

          await tx.detalleControlVacacion.update({
            where: { IdDetalleVacacion: detalleActual.IdDetalleVacacion },
            data: { DiasDescontados: nuevosDiasDescontados },
          });

          await tx.controlVacacion.update({
            where: { IdControlVacacion: detalleActual.IdControlVacacion },
            data: { DiasGozados: { increment: diferenciaDias } },
          });
        } else {
          // Vacaciones registradas sin descuento (datos antiguos): se registra ahora
          await registrarDescuentoVacaciones(
            tx,
            incidenciaActual.IdEmpleado,
            id,
            nuevosDiasDescontados,
          );
        }
      }

      return incidenciaActualizada;
    });
  }

  async remove(id: number) {
    const incidenciaActual = await this.findOne(id);

    // Usamos transacción para eliminar la incidencia y ajustar el control de vacaciones
    return await this.prisma.$transaction(async (tx) => {
      // 1. Si es Vacaciones, ajustar los días en ControlVacacion antes de eliminar
      if (incidenciaActual.TipoIncidencia === 'Vacaciones') {
        const detalleActual = await tx.detalleControlVacacion.findFirst({
          where: { IdIncidencia: id, Activo: true },
        });

        if (detalleActual) {
          // Obtener el control de vacaciones
          const controlVacacion = await tx.controlVacacion.findUnique({
            where: { IdControlVacacion: detalleActual.IdControlVacacion },
          });

          if (controlVacacion) {
            // Restar los días gozados
            const nuevosDiasGozados = Math.max(
              0,
              Number(controlVacacion.DiasGozados || 0) -
                Number(detalleActual.DiasDescontados || 0),
            );

            await tx.controlVacacion.update({
              where: { IdControlVacacion: controlVacacion.IdControlVacacion },
              data: { DiasGozados: nuevosDiasGozados },
            });
          }

          // Desactivar el detalle (borrado lógico)
          await tx.detalleControlVacacion.update({
            where: { IdDetalleVacacion: detalleActual.IdDetalleVacacion },
            data: {
              Activo: false,
              FechaEliminacion: new Date(),
            },
          });
        }
      }

      // 2. Eliminar la incidencia (borrado lógico)
      return await tx.incidencia.update({
        where: { IdIncidencia: id },
        data: {
          Activo: false,
          FechaEliminacion: new Date(),
        },
      });
    });
  }
}
