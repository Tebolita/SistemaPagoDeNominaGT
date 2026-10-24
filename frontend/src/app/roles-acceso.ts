// Roles con acceso a cada módulo. Única fuente para las rutas (roleGuard) y el menú lateral:
// cambiar un acceso aquí lo cambia en ambos lados. Los nombres se comparan sin distinguir
// mayúsculas y tratando espacios y guiones bajos como equivalentes.

/** Seguridad: usuarios, roles, auditoría. */
export const ROLES_SEGURIDAD = ['ADMINISTRADOR', 'ADMIN'];

/** Recursos Humanos y Configuración: empleados, vacaciones, asistencias, catálogos. */
export const ROLES_RRHH = ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'];

/** Nómina: generación, firmas y pago. Incluye a RRHH, que prepara la nómina. */
export const ROLES_NOMINA = ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS HUMANOS'];

/** Ventas y Finanzas: clientes, órdenes, cuentas bancarias y movimientos. */
export const ROLES_VENTAS_FINANZAS = ['ADMINISTRADOR', 'ADMIN', 'GERENTE'];

/** Indica si el rol pertenece a la lista, con la misma normalización que usa roleGuard. */
export function tieneRol(rol: string, permitidos: string[]): boolean {
  const normalizar = (r: string) => r.trim().toUpperCase().replace(/\s+/g, '_');
  const r = normalizar(rol);
  return permitidos.some((p) => normalizar(p) === r);
}
