import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface RegistrarAuditoriaDto {
  idUsuario?: number;
  username: string;
  accion: 'LOGIN' | 'LOGIN_FALLIDO' | 'LOGOUT';
  ip?: string;
  userAgent?: string;
  exitoso: boolean;
  detalle?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  async registrar(data: RegistrarAuditoriaDto) {
    return this.prisma.auditoriaSession.create({
      data: {
        IdUsuario:  data.idUsuario ?? null,
        Username:   data.username,
        Accion:     data.accion,
        FechaHora:  new Date(),
        DireccionIP: data.ip ?? null,
        UserAgent:  data.userAgent?.substring(0, 500) ?? null,
        Exitoso:    data.exitoso,
        Detalle:    data.detalle ?? null,
      },
    });
  }

  async findAll(params: {
    fechaDesde?: string;
    fechaHasta?: string;
    accion?: string;
    username?: string;
    exitoso?: string;
    page?: number;
    limit?: number;
  }) {
    const page  = Number(params.page)  || 1;
    const limit = Number(params.limit) || 50;
    const skip  = (page - 1) * limit;

    const where: any = {};

    if (params.fechaDesde || params.fechaHasta) {
      where.FechaHora = {};
      if (params.fechaDesde) where.FechaHora.gte = new Date(params.fechaDesde);
      if (params.fechaHasta) {
        const hasta = new Date(params.fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.FechaHora.lte = hasta;
      }
    }

    if (params.accion)   where.Accion   = params.accion;
    if (params.username) where.Username  = { contains: params.username };
    if (params.exitoso !== undefined && params.exitoso !== '') {
      where.Exitoso = params.exitoso === 'true';
    }

    const [total, registros] = await Promise.all([
      this.prisma.auditoriaSession.count({ where }),
      this.prisma.auditoriaSession.findMany({
        where,
        include: {
          Usuario: {
            select: {
              IdUsuario: true,
              Username:  true,
              RolUsuario: { select: { NombreRol: true } },
            },
          },
        },
        orderBy: { FechaHora: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, page, limit, registros };
  }

  async getResumen() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalHoy, fallidosHoy, totalSemana, ultimoLogin] = await Promise.all([
      this.prisma.auditoriaSession.count({
        where: { Accion: 'LOGIN', Exitoso: true, FechaHora: { gte: hoy } },
      }),
      this.prisma.auditoriaSession.count({
        where: { Accion: 'LOGIN_FALLIDO', FechaHora: { gte: hoy } },
      }),
      this.prisma.auditoriaSession.count({
        where: {
          Accion: 'LOGIN',
          Exitoso: true,
          FechaHora: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.auditoriaSession.findFirst({
        where: { Accion: 'LOGIN', Exitoso: true },
        orderBy: { FechaHora: 'desc' },
        select: { Username: true, FechaHora: true, DireccionIP: true },
      }),
    ]);

    return { totalHoy, fallidosHoy, totalSemana, ultimoLogin };
  }
}
