import { Module } from '@nestjs/common';
import { ConfigFirmanteService } from './config-firmante.service';
import { ConfigFirmanteController } from './config-firmante.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ConfigFirmanteController],
  providers:   [ConfigFirmanteService, PrismaService],
  exports:     [ConfigFirmanteService],
})
export class ConfigFirmanteModule {}
