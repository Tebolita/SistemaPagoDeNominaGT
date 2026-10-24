import type { CookieOptions, Request } from 'express';

/**
 * Sesión en cookie httpOnly (ISO 25010 – Seguridad: confidencialidad).
 * El JWT ya no queda al alcance de JavaScript (localStorage), así que un XSS no puede robarlo.
 * SameSite=Strict impide que otro sitio envíe la cookie; además las peticiones que modifican
 * datos autenticadas por cookie deben traer la cabecera X-Requested-With (defensa CSRF).
 */
export const COOKIE_SESION = 'access_token';
export const CABECERA_ANTI_CSRF = 'x-requested-with';
const DURACION_MS = 60 * 60 * 1000; // igual que expiresIn del JWT (60m)

export function opcionesCookieSesion(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'strict',
    // Secure exige HTTPS; activarlo con COOKIE_SECURE=true cuando el sitio se publique con TLS
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/api',
    maxAge: DURACION_MS,
  };
}

/** Lee una cookie del encabezado Cookie sin depender de cookie-parser. */
export function leerCookie(
  req: Pick<Request, 'headers'>,
  nombre: string,
): string | undefined {
  const encabezado = req.headers?.cookie;
  if (!encabezado) return undefined;
  for (const parte of encabezado.split(';')) {
    const i = parte.indexOf('=');
    if (i > 0 && parte.slice(0, i).trim() === nombre) {
      try {
        return decodeURIComponent(parte.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
