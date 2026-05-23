import { Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AuditoriaController],
  providers: [AuditoriaService, PrismaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
