import { Module } from '@nestjs/common';
import { EstadoNominaController } from './estado-nomina.controller';
import { EstadoNominaService } from './estado-nomina.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [EstadoNominaController],
  providers: [EstadoNominaService, PrismaService]
})
export class EstadoNominaModule {}
