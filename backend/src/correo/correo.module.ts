import { Module } from '@nestjs/common';
import { CorreoService } from './correo.service';
import { CorreoController } from './correo.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CorreoController],
  providers: [CorreoService, PrismaService],
  exports: [CorreoService],
})
export class CorreoModule {}
