// Datos de sesión visibles para la interfaz. El JWT NO se guarda aquí: viaja en una cookie
// httpOnly que pone el backend (ISO 25010 – Seguridad). Solo se guardan datos no secretos
// para el menú y la vigencia de la sesión.

export interface DatosSesion {
  access_token?: string;
  username?: string;
  role?: string;
}

const CLAVES = ['user_role', 'username', 'id_usuario', 'sesion_expira', 'access_token'];

/** Lee el payload de un JWT sin validarlo (la validación la hace el backend). */
function payloadJwt(token?: string): { sub?: number; exp?: number } {
  try {
    return token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : {};
  } catch {
    return {};
  }
}

export function guardarSesion(res: DatosSesion): void {
  const { sub, exp } = payloadJwt(res.access_token);
  if (res.role) localStorage.setItem('user_role', res.role);
  if (res.username) localStorage.setItem('username', res.username);
  if (sub) localStorage.setItem('id_usuario', String(sub));
  // Vigencia de la cookie: la del JWT o, si no se puede leer, 60 minutos
  localStorage.setItem('sesion_expira', String(exp ? exp * 1000 : Date.now() + 60 * 60 * 1000));
  localStorage.removeItem('access_token'); // restos de versiones anteriores
}

export function haySesion(ahora = Date.now()): boolean {
  const expira = Number(localStorage.getItem('sesion_expira'));
  return Number.isFinite(expira) && expira > ahora;
}

export function limpiarSesion(): void {
  CLAVES.forEach((k) => localStorage.removeItem(k));
}
