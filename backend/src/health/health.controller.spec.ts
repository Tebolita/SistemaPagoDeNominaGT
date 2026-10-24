import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde ok cuando la BD contesta', async () => {
    const ctrl = new HealthController({
      $queryRaw: jest.fn().mockResolvedValue([{ '': 1 }]),
    } as any);
    await expect(ctrl.check()).resolves.toMatchObject({
      status: 'ok',
      db: 'up',
    });
  });

  it('responde 503 cuando la BD no está disponible', async () => {
    const ctrl = new HealthController({
      $queryRaw: jest.fn().mockRejectedValue(new Error('down')),
    } as any);
    await expect(ctrl.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
