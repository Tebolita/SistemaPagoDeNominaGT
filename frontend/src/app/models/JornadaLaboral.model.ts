export interface JornadaLaboral {
  IdJornada: number;
  NombreJornada: string;
  HorasDiarias: number;
  HorasSemanales: number;
  Activo: boolean;
  FechaEliminacion?: Date;
}
