import { Module } from '@nestjs/common';
import { DepartamentoService } from './departamento.service';
import { DepartamentoController } from './departamento.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DepartamentoController],
  providers: [DepartamentoService, PrismaService],
  exports: [DepartamentoService],
})
export class DepartamentoModule {}
