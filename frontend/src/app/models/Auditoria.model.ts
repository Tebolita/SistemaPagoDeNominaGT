export interface AuditoriaSession {
  IdAuditoria: number;
  IdUsuario?: number;
  Username: string;
  Accion: 'LOGIN' | 'LOGIN_FALLIDO' | 'LOGOUT';
  FechaHora: string;
  DireccionIP?: string;
  UserAgent?: string;
  Exitoso: boolean;
  Detalle?: string;
  Usuario?: { IdUsuario: number; Username: string; RolUsuario?: { NombreRol: string } };
}

export interface AuditoriaResponse {
  total: number;
  page: number;
  limit: number;
  registros: AuditoriaSession[];
}

export interface AuditoriaResumen {
  totalHoy: number;
  fallidosHoy: number;
  totalSemana: number;
  ultimoLogin?: { Username: string; FechaHora: string; DireccionIP?: string };
}
