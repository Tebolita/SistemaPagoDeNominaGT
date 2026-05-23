export interface Permiso {
  IdPermiso: number;
  Modulo: string;
  Accion: string;
  Descripcion?: string;
  Activo?: boolean;
}

export interface RolInterface {
  IdRol?: number;
  NombreRol: string;
  Activo?: boolean;
  Permisos?: Permiso[];
}

export type PermisosAgrupados = Record<string, Permiso[]>;
