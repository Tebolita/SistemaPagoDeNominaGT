import { Module } from '@nestjs/common';
import { BancoService } from './banco.service';
import { BancoController } from './banco.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BancoController],
  providers: [BancoService, PrismaService],
  exports: [BancoService],
})
export class BancoModule {}
