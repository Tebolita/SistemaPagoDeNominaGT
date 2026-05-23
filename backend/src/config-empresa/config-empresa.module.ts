import { Module } from '@nestjs/common';
import { ConfigEmpresaService } from './config-empresa.service';
import { ConfigEmpresaController } from './config-empresa.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ConfigEmpresaController],
  providers: [ConfigEmpresaService, PrismaService],
  exports: [ConfigEmpresaService],
})
export class ConfigEmpresaModule {}
