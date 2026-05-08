import { Module } from '@nestjs/common';
import { ProductoServicioService } from './producto-servicio.service';
import { ProductoServicioController } from './producto-servicio.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProductoServicioController],
  providers: [ProductoServicioService, PrismaService],
  exports: [ProductoServicioService],
})
export class ProductoServicioModule {}