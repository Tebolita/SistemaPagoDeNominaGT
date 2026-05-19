export interface ParametroGlobal {
  IdParametro: number;
  NombreParametro: string;
  Valor: number;
  Descripcion?: string;
  Tipo?: 'INGRESO' | 'DESCUENTO' | 'REFERENCIA';
  Unidad?: '%' | 'Q';
  Activo: boolean;
  FechaEliminacion?: Date;
}
