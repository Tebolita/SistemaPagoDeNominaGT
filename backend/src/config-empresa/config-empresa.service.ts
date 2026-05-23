import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UpsertConfigEmpresaDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  NombreEmpresa: string;

  @IsString() @IsNotEmpty() @MaxLength(20)
  NIT: string;

  @IsOptional() @IsString() @MaxLength(300)
  Direccion?: string;

  @IsOptional() @IsString() @MaxLength(20)
  Telefono?: string;

  @IsOptional() @IsString() @MaxLength(100)
  CorreoEmpresa?: string;

  @IsOptional() @IsString() @MaxLength(50)
  RegimenFiscal?: string;

  @IsOptional() @IsString() @MaxLength(500)
  Logo?: string;
}

@Injectable()
export class ConfigEmpresaService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return this.prisma.configuracionEmpresa.findFirst({ orderBy: { IdConfig: 'desc' } });
  }

  async upsert(dto: UpsertConfigEmpresaDto) {
    const existing = await this.get();
    if (existing) {
      return this.prisma.configuracionEmpresa.update({
        where: { IdConfig: existing.IdConfig },
        data: { ...dto, FechaActualizacion: new Date() },
      });
    }
    return this.prisma.configuracionEmpresa.create({
      data: { ...dto, FechaActualizacion: new Date() },
    });
  }
}
