import { Module } from '@nestjs/common';
import { PrestamoService } from './prestamo.service';
import { PrestamoController } from './prestamo.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PrestamoController],
  providers: [PrestamoService, PrismaService],
})
export class PrestamoModule {}
