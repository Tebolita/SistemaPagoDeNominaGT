import { Module } from '@nestjs/common';
import { ParametroGlobalService } from './parametro-global.service';
import { ParametroGlobalController } from './parametro-global.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ParametroGlobalController],
  providers: [ParametroGlobalService, PrismaService],
  exports: [ParametroGlobalService],
})
export class ParametroGlobalModule {}
