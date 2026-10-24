import { HttpException } from '@nestjs/common';
import { IntentosLoginService } from './intentos-login.service';

describe('IntentosLoginService', () => {
  let svc: IntentosLoginService;
  const T0 = 1_000_000;
  beforeEach(() => (svc = new IntentosLoginService()));

  const fallar = (n: number, user = 'ana', t = T0) => {
    for (let i = 0; i < n; i++) svc.registrarFallo(user, t);
  };

  it('no bloquea antes del máximo de intentos', () => {
    fallar(IntentosLoginService.MAX_INTENTOS - 1);
    expect(() => svc.verificar('ana', T0)).not.toThrow();
  });

  it('bloquea con 429 al llegar al máximo, sin distinguir mayúsculas', () => {
    fallar(IntentosLoginService.MAX_INTENTOS);
    try {
      svc.verificar('ANA', T0 + 1000);
      fail('debía bloquear');
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429);
    }
  });

  it('el bloqueo vence pasado el tiempo y el conteo reinicia', () => {
    fallar(IntentosLoginService.MAX_INTENTOS);
    const despues = T0 + IntentosLoginService.BLOQUEO_MS + 1;
    expect(() => svc.verificar('ana', despues)).not.toThrow();
    svc.registrarFallo('ana', despues);
    expect(() => svc.verificar('ana', despues)).not.toThrow();
  });

  it('un login exitoso borra los fallos acumulados', () => {
    fallar(IntentosLoginService.MAX_INTENTOS - 1);
    svc.registrarExito('ana');
    fallar(IntentosLoginService.MAX_INTENTOS - 1);
    expect(() => svc.verificar('ana', T0)).not.toThrow();
  });

  it('el bloqueo de un usuario no afecta a otro', () => {
    fallar(IntentosLoginService.MAX_INTENTOS, 'ana');
    expect(() => svc.verificar('luis', T0)).not.toThrow();
  });

  it('no crece sin límite con usuarios inventados (purga al llegar al tope)', () => {
    for (let i = 0; i < IntentosLoginService.MAX_REGISTROS + 50; i++)
      svc.registrarFallo(`falso${i}`, T0);
    expect(svc.tamano).toBeLessThanOrEqual(IntentosLoginService.MAX_REGISTROS);
  });

  it('la purga conserva los bloqueos vigentes', () => {
    fallar(IntentosLoginService.MAX_INTENTOS, 'victima');
    for (let i = 0; i < IntentosLoginService.MAX_REGISTROS + 5; i++)
      svc.registrarFallo(`falso${i}`, T0 + 1);
    expect(() => svc.verificar('victima', T0 + 2)).toThrow();
  });
});
