import { Module } from '@nestjs/common';
import { CuentaBancariaEmpresaService } from './cuenta-bancaria-empresa.service';
import { CuentaBancariaEmpresaController } from './cuenta-bancaria-empresa.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CuentaBancariaEmpresaController],
  providers: [CuentaBancariaEmpresaService, PrismaService],
  exports: [CuentaBancariaEmpresaService],
})
export class CuentaBancariaEmpresaModule {}
