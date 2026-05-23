import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateConfigFirmanteDto {
  TipoFirmante: string;
  Descripcion?: string;
  RolesPermitidos?: string;
  IdEmpleadoRequerido?: number | null;
  Activo?: boolean;
}

@Injectable()
export class ConfigFirmanteService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.configFirmanteNomina.findMany({
      where: { Activo: true },
      include: {
        Empleado: { select: { IdEmpleado: true, Nombres: true, Apellidos: true } },
      },
      orderBy: { TipoFirmante: 'asc' },
    });
  }

  async findOne(id: number) {
    const config = await this.prisma.configFirmanteNomina.findUnique({
      where: { IdConfig: id },
      include: {
        Empleado: { select: { IdEmpleado: true, Nombres: true, Apellidos: true } },
      },
    });
    if (!config) throw new NotFoundException(`Configuración ${id} no encontrada`);
    return config;
  }

  findByTipo(tipoFirmante: string) {
    return this.prisma.configFirmanteNomina.findFirst({
      where: { TipoFirmante: tipoFirmante, Activo: true },
      include: {
        Empleado: { select: { IdEmpleado: true, Nombres: true, Apellidos: true } },
      },
    });
  }

  create(dto: CreateConfigFirmanteDto) {
    return this.prisma.configFirmanteNomina.create({
      data: {
        TipoFirmante:        dto.TipoFirmante,
        Descripcion:         dto.Descripcion,
        RolesPermitidos:     dto.RolesPermitidos ?? null,
        IdEmpleadoRequerido: dto.IdEmpleadoRequerido ?? null,
        Activo:              dto.Activo ?? true,
      },
      include: {
        Empleado: { select: { IdEmpleado: true, Nombres: true, Apellidos: true } },
      },
    });
  }

  async update(id: number, dto: Partial<CreateConfigFirmanteDto>) {
    await this.findOne(id);
    return this.prisma.configFirmanteNomina.update({
      where: { IdConfig: id },
      data: {
        Descripcion:         dto.Descripcion,
        RolesPermitidos:     dto.RolesPermitidos,
        IdEmpleadoRequerido: dto.IdEmpleadoRequerido ?? null,
        Activo:              dto.Activo,
      },
      include: {
        Empleado: { select: { IdEmpleado: true, Nombres: true, Apellidos: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.configFirmanteNomina.update({
      where: { IdConfig: id },
      data: { Activo: false, FechaEliminacion: new Date() },
    });
  }

  /** Valida si un usuario puede firmar como un tipo específico */
  async puedeUsuarioFirmar(
    tipoFirmante: string,
    idUsuario: number,
  ): Promise<{ puede: boolean; razon?: string }> {
    const config = await this.findByTipo(tipoFirmante);

    const usuario = await this.prisma.usuario.findUnique({
      where: { IdUsuario: idUsuario },
      include: { RolUsuario: { select: { NombreRol: true } } },
    });

    if (!usuario) return { puede: false, razon: 'Usuario no encontrado' };

    if (!config) {
      // Sin config: cualquier rol de aprobación puede firmar (comportamiento legacy)
      const rolesAprobacion = ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS_HUMANOS', 'RECURSOS HUMANOS'];
      const rol = (usuario.RolUsuario?.NombreRol ?? '').trim().toUpperCase();
      const puede = rolesAprobacion.some(r => r === rol || r.replace(/\s+/g, '_') === rol.replace(/\s+/g, '_'));
      return { puede, razon: puede ? undefined : `El rol ${rol} no tiene permiso para firmar` };
    }

    // Empleado específico requerido
    if (config.IdEmpleadoRequerido) {
      if (usuario.IdEmpleado !== config.IdEmpleadoRequerido) {
        const emp = config.Empleado;
        return {
          puede: false,
          razon: `Solo ${emp?.Nombres} ${emp?.Apellidos} puede firmar como ${tipoFirmante}`,
        };
      }
      return { puede: true };
    }

    // Validar por roles
    if (config.RolesPermitidos) {
      const permitidos = config.RolesPermitidos
        .split(',')
        .map(r => r.trim().toUpperCase().replace(/\s+/g, '_'));
      const rolUsuario = (usuario.RolUsuario?.NombreRol ?? '').trim().toUpperCase().replace(/\s+/g, '_');
      const puede = permitidos.includes(rolUsuario);
      return {
        puede,
        razon: puede ? undefined : `Tu rol (${usuario.RolUsuario?.NombreRol}) no tiene permiso para firmar como ${tipoFirmante}`,
      };
    }

    return { puede: true };
  }
}
