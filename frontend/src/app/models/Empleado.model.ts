export interface EmpleadoResponse {
  IdEmpleado: number;    
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  NombreCompleto: string;
  CorreoPersonal: string;
  FechaIngresa: Date | null;
  IdPuesto: number;      
  IdJornada?: number;
  IdBanco?: number;
  Activo: boolean;
  FechaEliminacion: Date | null;
  Telefono: string;     
  Genero: boolean;       
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string;
  CuentaBancaria?: string;
  Usuario: {
    IdUsuario?: number;
    IdRol?: number;
    RolUsuario: {
      NombreRol: string
    }
  }[];
  Puesto: {
    NombrePuesto: string
  };
  JornadaLaboral?: {
    IdJornada?: number;
    NombreJornada: string;
  };
  Banco?: {
    IdBanco?: number;
    NombreBanco: string;
  };
}

export interface EmpleadoRequest {
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  CorreoPersonal: string;
  FechaIngresa: Date | null;
  IdPuesto: number;
  IdJornada: number;
  IdBanco?: number;
  CuentaBancaria?: string;
  Activo: boolean;
  FechaEliminacion: Date | null;
  Telefono: string;
  Genero: boolean;
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string;
}
export interface EmpleadoResponseCUD {
  message: string;
  id: number;
}