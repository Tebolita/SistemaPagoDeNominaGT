export interface FirmaNomina {
  IdFirma: number;
  IdNomina: number;
  TipoFirmante: 'JEFE_AREA' | 'ENCARGADO';
  IdUsuario: number;
  FechaFirma: Date;
  Comentarios?: string;
  Activo?: boolean;
  Usuario?: { Username: string };
}

export interface Nomina {
  IdNomina: number;
  Mes: number;
  Anio: number;
  Quincena?: number;
  FechaGeneracion?: Date;
  Estado?: string;
  TipoNomina?: 'GENERAL' | 'PERSONALIZADA';
  IdUsuarioGerente?: number;
  IdEstadoActual?: number;
  NumeroBoleta?: string;
  IdCuenta?: number;
  EstadoNomina?: { NombreEstado: string };
  FirmaNomina?: FirmaNomina[];
  CuentaBancariaEmpresa?: { IdCuenta: number; NombreCuenta: string; NumeroCuenta: string; SaldoActual: number; Moneda?: string };
  Activo?: boolean;
  FechaEliminacion?: Date;
  NominaDetalle?: NominaDetalle[];
}

export interface NominaDetalle {
  IdNominaDetalle: number;
  IdNomina: number;
  IdEmpleado: number;
  DiasLaborados?: number;
  SueldoBase: number;
  BonificacionIncentivo?: number;
  OtrosIngresos?: number;
  DescuentoIGSS?: number;
  DescuentoISR?: number;
  OtrosDescuentos?: number;
  LiquidoRecibir?: number;
  Activo?: boolean;
  FechaEliminacion?: Date;
  Empleado?: {
    IdEmpleado: number;
    Nombres: string;
    Apellidos: string;
    DPI: string;
    NIT: string;
  };
}

export interface NominaCalculo {
  salarioBase: number;
  bono14: number;
  aguinaldo: number;
  bonoProductividad: number;
  horasExtras: number;
  valorHoraExtra: number;
  pagoHorasExtras: number;
  totalIngresos: number;
  descuentoIGSS: number;
  descuentoISR: number;
  descuentoIRTRA: number;
  descuentoINTECAP: number;
  totalDescuentos: number;
  netoAPagar: number;
}

export interface NominaMasivaResultado {
  idNomina: number;
  mes: number;
  anio: number;
  fechaGeneracion: Date;
  totalEmpleados: number;
  detalles: {
    idEmpleado: number;
    empleado: string;
    liquidoRecibir: number;
  }[];
}
