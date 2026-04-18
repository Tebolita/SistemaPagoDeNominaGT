import { Module } from '@nestjs/common';
import { PuestoService } from './puesto.service';
import { PuestoController } from './puesto.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PuestoController],
  providers: [PuestoService, PrismaService],
  exports: [PuestoService],
})
export class PuestoModule {}
