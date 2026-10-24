import type { Request } from 'express';

/** Payload que el AuthGuard deja en request.user a partir del JWT. */
export interface UsuarioJwt {
  sub: number;
  username: string;
  role?: string;
}

/** Request autenticada: sustituye a `req: any` en los controladores. */
export type RequestConUsuario = Request & { user?: UsuarioJwt };
