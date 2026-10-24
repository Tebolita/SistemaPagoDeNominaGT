import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './login.guard';

// Regresión de D-01: el guard es global; solo las rutas con @Public() quedan abiertas
describe('AuthGuard', () => {
  let jwt: any;
  let reflector: Reflector;
  let guard: AuthGuard;

  const contexto = (headers: Record<string, string> = {}) => {
    const request: any = { headers };
    return {
      request,
      ctx: {
        getHandler: () => () => undefined,
        getClass: () => class {},
        switchToHttp: () => ({ getRequest: () => request }),
      } as any,
    };
  };

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn() };
    reflector = new Reflector();
    guard = new AuthGuard(jwt, reflector);
  });

  it('deja pasar una ruta marcada con @Public() sin token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    await expect(guard.canActivate(contexto().ctx)).resolves.toBe(true);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rechaza una ruta protegida sin token', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    await expect(guard.canActivate(contexto().ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza un token inválido o expirado', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    const { ctx } = contexto({ authorization: 'Bearer token-viejo' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('con un token válido deja pasar y adjunta el usuario a la petición', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    jwt.verifyAsync.mockResolvedValue({ sub: 1, username: 'admin', role: 'ADMIN' });

    const { ctx, request } = contexto({ authorization: 'Bearer token-valido' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 1, username: 'admin', role: 'ADMIN' });
  });

  it('ignora encabezados que no son de tipo Bearer', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const { ctx } = contexto({ authorization: 'Basic dXN1YXJpbzpjbGF2ZQ==' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
