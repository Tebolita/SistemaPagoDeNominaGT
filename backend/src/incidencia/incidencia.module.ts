import { Module } from '@nestjs/common';
import { IncidenciaService } from './incidencia.service';
import { IncidenciaController } from './incidencia.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [IncidenciaController],
  providers: [IncidenciaService,PrismaService],
})
export class IncidenciaModule {}
