export interface ConfigFirmanteNomina {
  IdConfig: number;
  TipoFirmante: string;
  Descripcion?: string;
  RolesPermitidos?: string;
  IdEmpleadoRequerido?: number | null;
  Activo: boolean;
  FechaEliminacion?: Date;
  Empleado?: { IdEmpleado: number; Nombres: string; Apellidos: string };
}
