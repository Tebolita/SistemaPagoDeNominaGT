export interface UsuarioResponse {
    Username: string;
    Contrasena: string;
    Clave: string;
    IdRol: number;
    IdEmpleado: number;
}
export interface UsuarioRequest {
    Username: string;
    Contrasena: string;
    Clave: string;
    IdRol: number;
    IdEmpleado: number;
}
export interface UsuarioResponseCUD {
  message: string;
  id: string
}