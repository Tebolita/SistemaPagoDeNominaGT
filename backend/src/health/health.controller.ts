import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from 'src/prisma/prisma.service';
import { Public } from 'src/login/public.decorator';

/** Sondeo de salud para Docker / balanceadores (ISO 25010 – Fiabilidad: madurez y disponibilidad). */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up', uptime: Math.round(process.uptime()) };
    } catch {
      // 503 para que el orquestador marque el contenedor como no saludable
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
