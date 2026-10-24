import { leerCookie, opcionesCookieSesion } from './sesion-cookie';

describe('sesion-cookie', () => {
  it('lee una cookie entre varias', () => {
    expect(
      leerCookie(
        { headers: { cookie: 'a=1; access_token=abc.def; b=2' } },
        'access_token',
      ),
    ).toBe('abc.def');
  });
  it('devuelve undefined si no está o no hay encabezado', () => {
    expect(
      leerCookie({ headers: { cookie: 'a=1' } }, 'access_token'),
    ).toBeUndefined();
    expect(leerCookie({ headers: {} }, 'access_token')).toBeUndefined();
  });
  it('no confunde un nombre que solo empieza igual', () => {
    expect(
      leerCookie(
        { headers: { cookie: 'access_token_viejo=x' } },
        'access_token',
      ),
    ).toBeUndefined();
  });
  it('la cookie es httpOnly, SameSite=Strict y limitada a /api', () => {
    const o = opcionesCookieSesion();
    expect(o).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      path: '/api',
    });
  });
  it('Secure se activa con COOKIE_SECURE=true', () => {
    process.env.COOKIE_SECURE = 'true';
    expect(opcionesCookieSesion().secure).toBe(true);
    delete process.env.COOKIE_SECURE;
    expect(opcionesCookieSesion().secure).toBe(false);
  });
});
