export interface LoginRequest {
    Username: string;
    Contrasena: string;
    Clave: number;
}

export interface LoginResponse {
  access_token: string;
}