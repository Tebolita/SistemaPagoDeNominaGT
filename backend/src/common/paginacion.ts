/**
 * Paginación opcional de listados (misma convención que /api/auditoria).
 * Si la petición no envía `page`, el listado responde el arreglo completo como antes,
 * para no romper las pantallas que todavía paginan en el navegador.
 */
export const LIMITE_POR_DEFECTO = 50;
export const LIMITE_MAXIMO = 200;

export interface Paginacion {
  page: number;
  limit: number;
  skip: number;
}

export interface Paginado<T> {
  total: number;
  page: number;
  limit: number;
  registros: T[];
}

export function leerPaginacion(page?: string, limit?: string): Paginacion | undefined {
  if (page === undefined || page === '') return undefined;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(LIMITE_MAXIMO, Math.max(1, parseInt(limit ?? '', 10) || LIMITE_POR_DEFECTO));
  return { page: p, limit: l, skip: (p - 1) * l };
}
