import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateIncidenciaDto } from './dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from './dto/update-incidencia.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class IncidenciaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createIncidenciaDto: CreateIncidenciaDto) {
    // Usamos transacción para crear la incidencia y el control de vacaciones
    return await this.prisma.$transaction(async (tx) => {
      
      // 1. Crear la incidencia
      const incidencia = await tx.incidencia.create({
        data: createIncidenciaDto,
      });

      // 2. Si es de tipo Vacaciones, crear ControlVacacion y DetalleControlVacacion
      if (createIncidenciaDto.TipoIncidencia === 'Vacaciones') {
        const anioActual = new Date().getFullYear();
        
        // 2a. Buscar o crear el ControlVacacion del empleado para el año actual
        let controlVacacion = await tx.controlVacacion.findFirst({
          where: {
            IdEmpleado: createIncidenciaDto.IdEmpleado,
            AnioCorriente: anioActual,
            Activo: true
          }
        });

        if (!controlVacacion) {
          // Crear nuevo control de vacaciones para el año
          controlVacacion = await tx.controlVacacion.create({
            data: {
              IdEmpleado: createIncidenciaDto.IdEmpleado,
              AnioCorriente: anioActual,
              DiasGanados: 15, // Días mínimos legales en Guatemala
              DiasGozados: 0,
              Activo: true
            }
          });
        }

        // 2b. Calcular los días de vacaciones (diferencia entre fechas)
        const fechaInicio = new Date(createIncidenciaDto.FechaInicio);
        const fechaFin = new Date(createIncidenciaDto.FechaFin);
        const diasDescontados = Math.ceil(
          (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1; // +1 para incluir el día inicial

        // 2c. Crear el detalle de control de vacaciones
        await tx.detalleControlVacacion.create({
          data: {
            IdControlVacacion: controlVacacion.IdControlVacacion,
            IdIncidencia: incidencia.IdIncidencia,
            DiasDescontados: diasDescontados,
            Activo: true
          }
        });

        // 2d. Actualizar los días gozados en ControlVacacion
        await tx.controlVacacion.update({
          where: { IdControlVacacion: controlVacacion.IdControlVacacion },
          data: {
            DiasGozados: Number(controlVacacion.DiasGozados || 0) + diasDescontados
          }
        });
      }

      return incidencia;
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

  // Obtiene solo las incidencias de tipo Vacaciones con sus detalles de control
  async findVacaciones() {
    return await this.prisma.incidencia.findMany({
      where: { 
        TipoIncidencia: 'Vacaciones',
        Activo: true
      },
      include: { 
        Empleado: {
          include: {
            Puesto: {
              include: {
                Departamento: true
              }
            }
          }
        },
        Usuario: true,
        DetalleControlVacacion: {
          include: {
            ControlVacacion: true
          }
        }
      },
      orderBy: { FechaInicio: 'desc' }
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
        data: dataToUpdate
      });

      // 2. Si es Vacaciones y se modificaron las fechas, actualizar ControlVacacion
      if (incidenciaActual.TipoIncidencia === 'Vacaciones' && 
          (dataToUpdate.FechaInicio || dataToUpdate.FechaFin)) {
        
        const fechaInicio = dataToUpdate.FechaInicio 
          ? new Date(dataToUpdate.FechaInicio) 
          : new Date(incidenciaActual.FechaInicio);
        const fechaFin = dataToUpdate.FechaFin 
          ? new Date(dataToUpdate.FechaFin) 
          : new Date(incidenciaActual.FechaFin);
        
        const nuevosDiasDescontados = Math.ceil(
          (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

        // Obtener el detalle actual para ajustar los días
        const detalleActual = await tx.detalleControlVacacion.findFirst({
          where: { IdIncidencia: id, Activo: true }
        });

        if (detalleActual) {
          const diferenciaDias = nuevosDiasDescontados - Number(detalleActual.DiasDescontados || 0);
          
          // Actualizar el detalle
          await tx.detalleControlVacacion.update({
            where: { IdDetalleVacacion: detalleActual.IdDetalleVacacion },
            data: { DiasDescontados: nuevosDiasDescontados }
          });

          // Actualizar los días gozados en ControlVacacion
          const controlVacacion = await tx.controlVacacion.findUnique({
            where: { IdControlVacacion: detalleActual.IdControlVacacion }
          });

          if (controlVacacion) {
            await tx.controlVacacion.update({
              where: { IdControlVacacion: controlVacacion.IdControlVacacion },
              data: {
                DiasGozados: Number(controlVacacion.DiasGozados || 0) + diferenciaDias
              }
            });
          }
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
          where: { IdIncidencia: id, Activo: true }
        });

        if (detalleActual) {
          // Obtener el control de vacaciones
          const controlVacacion = await tx.controlVacacion.findUnique({
            where: { IdControlVacacion: detalleActual.IdControlVacacion }
          });

          if (controlVacacion) {
            // Restar los días gozados
            const nuevosDiasGozados = Math.max(0, 
              Number(controlVacacion.DiasGozados || 0) - Number(detalleActual.DiasDescontados || 0)
            );
            
            await tx.controlVacacion.update({
              where: { IdControlVacacion: controlVacacion.IdControlVacacion },
              data: { DiasGozados: nuevosDiasGozados }
            });
          }

          // Desactivar el detalle (borrado lógico)
          await tx.detalleControlVacacion.update({
            where: { IdDetalleVacacion: detalleActual.IdDetalleVacacion },
            data: { 
              Activo: false,
              FechaEliminacion: new Date()
            }
          });
        }
      }

      // 2. Eliminar la incidencia (borrado lógico)
      return await tx.incidencia.update({
        where: { IdIncidencia: id },
        data: {
          Activo: false,
          FechaEliminacion: new Date()
        }
      });
    });
  }
}