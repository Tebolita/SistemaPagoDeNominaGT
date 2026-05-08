import { Module } from '@nestjs/common';
import { MovimientoFinancieroService } from './movimiento-financiero.service';
import { MovimientoFinancieroController } from './movimiento-financiero.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MovimientoFinancieroController],
  providers: [MovimientoFinancieroService, PrismaService],
  exports: [MovimientoFinancieroService],
})
export class MovimientoFinancieroModule {}
