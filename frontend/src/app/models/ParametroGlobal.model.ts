export interface ParametroGlobal {
  IdParametro: number;
  NombreParametro: string;
  Valor: number;
  Descripcion?: string;
  Tipo?: 'INGRESO' | 'DESCUENTO' | 'REFERENCIA';
  Unidad?: '%' | 'Q';
  Activo: boolean;
  FechaEliminacion?: Date;
  // Filtros de aplicación selectiva
  FiltroGenero?: boolean | null;
  FiltroIdDepartamento?: number | null;
  FiltroIdPuesto?: number | null;
  FiltroIdJornada?: number | null;
  // Relaciones (devueltas por el backend)
  Departamento?: { NombreDepartamento: string };
  Puesto?: { NombrePuesto: string };
  JornadaLaboral?: { NombreJornada: string };
}
