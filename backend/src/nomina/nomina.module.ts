import { Module } from '@nestjs/common';
import { NominaService } from './nomina.service';
import { NominaController } from './nomina.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [ExportModule],
  controllers: [NominaController],
  providers: [NominaService, PrismaService],
})
export class NominaModule {}
