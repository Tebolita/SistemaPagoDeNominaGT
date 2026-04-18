export interface EmpleadoResponse {
  IdEmpleado: number;    
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  CorreoPersonal: string;
  FechaIngresa: Date | null;
  IdPuesto: number;      
  Activo: boolean;
  FechaEliminacion: Date | null;
  Telefono: string;     
  Genero: boolean;       
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string;
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
}

export interface EmpleadoRequest {
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  CorreoPersonal: string;
  FechaIngresa: Date | null;
  IdPuesto: number;
  Activo: boolean;
  FechaEliminacion: Date | null;
  Telefono: string;
  Genero: boolean;
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string;
  IdJornada: number;
}
export interface EmpleadoResponseCUD {
  message: string;
  id: number;
}