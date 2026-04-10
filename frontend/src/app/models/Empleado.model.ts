export interface EmpleadoResponse {
  IdEmpleado: 0;
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  CorreoPersonal: string;
  FechaIngresa: Date | null;
  IdPuesto: 0;
  Estado: boolean;
  FechaEliminacion: Date | null;
  Telefono: 0;
  Genero: false;
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string;
  Usuario: 
  {
    RolUsuario: {
      NombreRol: string
    }
  }[],
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
  Genero: false;
  EstadoCivil: string;
  Direccion: string;
  Fotografia: string; 
}
export interface EmpleadoResponseCUD {
  message: string;
  id: string
}