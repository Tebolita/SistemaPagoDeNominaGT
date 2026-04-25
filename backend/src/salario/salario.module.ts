import { Module } from '@nestjs/common';
import { SalarioService } from './salario.service';
import { SalarioController } from './salario.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SalarioController],
  providers: [SalarioService, PrismaService],
  exports: [SalarioService],
})
export class SalarioModule {}