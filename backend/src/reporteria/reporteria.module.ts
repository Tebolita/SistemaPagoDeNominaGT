import { Module } from '@nestjs/common';
import { ReporteriaService } from './reporteria.service';
import { ReporteriaController } from './reporteria.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [ExportModule],
  controllers: [ReporteriaController],
  providers: [ReporteriaService, PrismaService],
})
export class ReporteriaModule {}