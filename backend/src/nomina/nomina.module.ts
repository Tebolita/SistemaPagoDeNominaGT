import { Module } from '@nestjs/common';
import { NominaService } from './nomina.service';
import { NominaController } from './nomina.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ExportModule } from '../export/export.module';
import { ConfigFirmanteModule } from '../config-firmante/config-firmante.module';
import { CorreoModule } from '../correo/correo.module';

@Module({
  imports: [ExportModule, ConfigFirmanteModule, CorreoModule],
  controllers: [NominaController],
  providers: [NominaService, PrismaService],
})
export class NominaModule {}
