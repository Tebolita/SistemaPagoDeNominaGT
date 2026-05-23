import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolService {
  constructor(private prisma: PrismaService) {}

  async create(createRolDto: CreateRolDto) {
    return await this.prisma.rolUsuario.create({
      data: { NombreRol: createRolDto.NombreRol, Activo: true },
    });
  }

  async findAll() {
    const roles = await this.prisma.rolUsuario.findMany({
      include: {
        RolPermiso: {
          include: { Permiso: true },
        },
      },
      orderBy: { NombreRol: 'asc' },
    });
    return roles.map((r) => ({
      ...r,
      Permisos: r.RolPermiso.map((rp) => rp.Permiso),
    }));
  }

  async findOne(id: number) {
    const rol = await this.prisma.rolUsuario.findFirst({
      where: { IdRol: id },
      include: {
        RolPermiso: { include: { Permiso: true } },
      },
    });
    if (!rol) throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    return { ...rol, Permisos: rol.RolPermiso.map((rp) => rp.Permiso) };
  }

  async update(id: number, updateRolDto: UpdateRolDto) {
    await this.findOne(id);
    return await this.prisma.rolUsuario.update({
      where: { IdRol: id },
      data: { ...updateRolDto },
    });
  }

  async remove(id: number) {
    const rol = await this.findOne(id);
    return await this.prisma.rolUsuario.update({
      where: { IdRol: id },
      data: { Activo: !rol.Activo, FechaEliminacion: new Date() },
    });
  }

  // ── Catálogo de permisos ──────────────────────────────────────────
  async getPermisos() {
    const permisos = await this.prisma.permiso.findMany({
      where: { NOT: { Activo: false } },
      orderBy: [{ Modulo: 'asc' }, { Accion: 'asc' }],
    });

    // Agrupar por módulo
    const grupos: Record<string, typeof permisos> = {};
    for (const p of permisos) {
      if (!grupos[p.Modulo]) grupos[p.Modulo] = [];
      grupos[p.Modulo].push(p);
    }
    return grupos;
  }

  // ── Permisos de un rol ────────────────────────────────────────────
  async getPermisosRol(idRol: number) {
    const asignaciones = await this.prisma.rolPermiso.findMany({
      where: { IdRol: idRol },
      include: { Permiso: true },
    });
    return asignaciones.map((a) => a.Permiso);
  }

  // ── Reemplazar permisos de un rol ─────────────────────────────────
  async asignarPermisos(idRol: number, idPermisos: number[]) {
    await this.findOne(idRol);

    // Eliminar los actuales y recrear
    await this.prisma.rolPermiso.deleteMany({ where: { IdRol: idRol } });

    if (idPermisos.length > 0) {
      await this.prisma.rolPermiso.createMany({
        data: idPermisos.map((IdPermiso) => ({ IdRol: idRol, IdPermiso })),
      });
    }

    return this.getPermisosRol(idRol);
  }
}
