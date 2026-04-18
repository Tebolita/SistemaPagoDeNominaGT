import { Module } from '@nestjs/common';
import { JornadaLaboralService } from './jornada-laboral.service';
import { JornadaLaboralController } from './jornada-laboral.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [JornadaLaboralController],
  providers: [JornadaLaboralService, PrismaService],
  exports: [JornadaLaboralService],
})
export class JornadaLaboralModule {}
