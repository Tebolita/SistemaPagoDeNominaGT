import { Module } from '@nestjs/common';
import { ControlVacacionService } from './control-vacacion.service';
import { ControlVacacionController } from './control-vacacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ControlVacacionController],
  providers: [ControlVacacionService,PrismaService],
})
export class ControlvacacionModule {}
