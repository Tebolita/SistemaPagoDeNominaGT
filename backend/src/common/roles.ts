import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestConUsuario } from './request-con-usuario';

// Misma matriz de acceso que frontend/src/app/roles-acceso.ts (única fuente en cada capa).
export const ROLES_SEGURIDAD = ['ADMINISTRADOR', 'ADMIN'];
export const ROLES_RRHH = [
  'ADMINISTRADOR',
  'ADMIN',
  'RRHH',
  'RECURSOS HUMANOS',
];
export const ROLES_NOMINA = [
  'ADMINISTRADOR',
  'ADMIN',
  'GERENTE',
  'RRHH',
  'RECURSOS HUMANOS',
];
export const ROLES_VENTAS_FINANZAS = ['ADMINISTRADOR', 'ADMIN', 'GERENTE'];

export const ROLES_KEY = 'roles';

/** Restringe una ruta (o todo el controlador) a los roles indicados. El método pisa a la clase. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

const normalizar = (r: string) => r.trim().toUpperCase().replace(/\s+/g, '_');

/** Misma normalización que usa roleGuard en el frontend. */
export function tieneRol(
  rol: string | undefined,
  permitidos: string[],
): boolean {
  if (!rol) return false;
  const r = normalizar(rol);
  return permitidos.some((p) => normalizar(p) === r);
}

/**
 * Autorización por rol en el backend (ISO 25010 – Seguridad / Autenticidad y Responsabilidad).
 * Se ejecuta después del AuthGuard global, que deja el payload del JWT en request.user.
 * Las rutas sin @Roles() solo exigen estar autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permitidos || permitidos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<RequestConUsuario>();
    if (!tieneRol(user?.role, permitidos)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }
    return true;
  }
}
