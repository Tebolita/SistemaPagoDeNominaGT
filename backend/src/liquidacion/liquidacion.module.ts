import { Module } from '@nestjs/common';
import { LiquidacionService } from './liquidacion.service';
import { LiquidacionController } from './liquidacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [LiquidacionController],
  providers: [LiquidacionService, PrismaService],
})
export class LiquidacionModule {}
