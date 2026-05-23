export interface Departamento {
  IdDepartamento: number;
  NombreDepartamento: string;
  Activo: boolean;
  FechaEliminacion?: Date;
  Presupuesto?: number | null;
  PresupuestoUsado?: number;
}
