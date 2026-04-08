export interface EmpleadoInterface {
  IdEmpleado: 0;
  DPI: string;
  NIT: string;
  Nombres: string;
  Apellidos: string;
  CorreoPersonal: string;
  FechaIngresa: Date;
  IdPuesto: 0;
  Estado: true;
  FechaEliminacion: Date;
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
  }[];
}
export interface EmpleadoResponse {
  message: string;
}