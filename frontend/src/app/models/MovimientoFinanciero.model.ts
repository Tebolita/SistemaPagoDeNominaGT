export interface MovimientoFinanciero {
  IdMovimiento: number;
  IdCuenta: number;
  TipoMovimiento: 'INGRESO' | 'EGRESO';
  Categoria: string;
  Subcategoria?: string;
  Monto: number;
  FechaMovimiento: string;
  Referencia?: string;
  IdUsuarioRegistra: number;
  IdVenta?: number;
  IdNomina?: number;
  Notas?: string;
  Activo: boolean;
  FechaEliminacion?: string;
}

export interface BalanceInfo {
  saldo: number;
  ingresos: number;
  egresos: number;
}
