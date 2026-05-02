export interface SalarioResponse {
  IdHistorico: number;
  IdEmpleado: number;
  SalarioBase: number;
  FechaInicioVigencia: string | null;
  FechaFinVigencia: string | null;
  Activo: boolean;
  FechaEliminacion: string | null;
  NombreEmpleado?: string;
}

export interface SalarioRequest {
  IdEmpleado: number;
  SalarioBase: number;
  FechaInicioVigencia: string;
  FechaFinVigencia?: string;
  Activo: boolean;
}

export interface SalarioResponseCUD {
  message: string;
  id: number;
}