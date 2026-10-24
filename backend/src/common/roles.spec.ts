import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Roles,
  RolesGuard,
  ROLES_SEGURIDAD,
  ROLES_VENTAS_FINANZAS,
  tieneRol,
} from './roles';

// Contexto mínimo de ejecución: el método del controlador y un rol en request.user
const contexto = (
  clase: abstract new () => object,
  metodo: string,
  role?: string,
): ExecutionContext => {
  const handler = Object.getOwnPropertyDescriptor(clase.prototype, metodo)
    ?.value as () => void;
  return {
    getHandler: () => handler,
    getClass: () => clase,
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
};

describe('tieneRol', () => {
  it('compara sin distinguir mayúsculas, espacios ni guiones bajos', () => {
    expect(tieneRol('recursos humanos', ['RECURSOS HUMANOS'])).toBe(true);
    expect(tieneRol('Recursos_Humanos', ['RECURSOS HUMANOS'])).toBe(true);
  });
  it('rechaza roles ausentes o no permitidos', () => {
    expect(tieneRol(undefined, ROLES_SEGURIDAD)).toBe(false);
    expect(tieneRol('GERENTE', ROLES_SEGURIDAD)).toBe(false);
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  @Roles(...ROLES_VENTAS_FINANZAS)
  class ControladorRestringido {
    @Roles(...ROLES_SEGURIDAD)
    soloAdmin() {}
    heredaDeClase() {}
  }
  class ControladorLibre {
    cualquiera() {}
  }

  it('deja pasar a cualquier autenticado si la ruta no declara @Roles', () => {
    expect(
      guard.canActivate(contexto(ControladorLibre, 'cualquiera', 'RRHH')),
    ).toBe(true);
  });

  it('permite el rol exigido por la clase', () => {
    expect(
      guard.canActivate(
        contexto(ControladorRestringido, 'heredaDeClase', 'GERENTE'),
      ),
    ).toBe(true);
  });

  it('el @Roles del método pisa al de la clase', () => {
    expect(() =>
      guard.canActivate(
        contexto(ControladorRestringido, 'soloAdmin', 'GERENTE'),
      ),
    ).toThrow(ForbiddenException);
    expect(
      guard.canActivate(contexto(ControladorRestringido, 'soloAdmin', 'ADMIN')),
    ).toBe(true);
  });

  it('rechaza si no hay usuario o rol en el token', () => {
    expect(() =>
      guard.canActivate(contexto(ControladorRestringido, 'heredaDeClase')),
    ).toThrow(ForbiddenException);
  });
});
