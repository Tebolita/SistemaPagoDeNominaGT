export interface EmpleadoResponse {
  IdEmpleado: number;    // Antes tenías 0
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  CorreoPersonal: string;
  FechaIngresa: Date | null;
  IdPuesto: number;      // Antes tenías 0
  Estado: boolean;
  FechaEliminacion: Date | null;
  Telefono: number;      // Antes tenías 0
  Genero: boolean;       // Antes tenías false
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string;
  Usuario: {
    RolUsuario: {
      NombreRol: string
    }
  }[];
  Puesto: {
    NombrePuesto: string
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
  Estado: boolean;
  FechaEliminacion: Date | null;
  Telefono: number;
  Genero: boolean;
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string; 
}
export interface EmpleadoResponseCUD {
  message: string;
  id: string
}