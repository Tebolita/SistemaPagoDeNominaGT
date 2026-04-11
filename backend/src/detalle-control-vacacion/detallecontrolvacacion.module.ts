import { Module } from '@nestjs/common';
import { DetalleControlVacacionService } from './detalle-control-vacacion.service';
import { DetalleControlVacacionController } from './detalle-control-vacacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DetalleControlVacacionController],
  providers: [DetalleControlVacacionService, PrismaService],
})
export class DetallecontrolvacacionModule {}
