export interface Banco {
  IdBanco: number;
  NombreBanco: string;
  Activo: boolean;
}

export interface CuentaBancariaEmpresa {
  IdCuenta: number;
  IdBanco: number;
  NumeroCuenta: string;
  NombreCuenta: string;
  TipoCuenta?: string;
  SaldoActual: number;
  Moneda?: string;
  Activo: boolean;
  FechaEliminacion?: string;
  Banco?: Banco;
}
