export interface LoginRequest {
    Username: string;
    Contrasena: string;
    Clave: number;
}

export interface LoginResponse {
  access_token: string;
  username?: string;
  role?: string;
  message?: string;
}

export interface LoginProfile {
  sub: number;
  username: string;
  role: string;
}