export interface Nomina {
  IdNomina: number;
  Mes: number;
  Anio: number;
  Quincena?: number;
  FechaGeneracion?: Date;
  Estado?: string;
  IdUsuarioGerente?: number;
  IdEstadoActual?: number;
  EstadoNomina?: {
    NombreEstado: string;
  };
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
