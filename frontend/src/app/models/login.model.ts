export interface LoginRequest {
    Username: string;
    Contrasena: string;
    Clave: number;
}

export interface LoginResponse {
  /** También llega en una cookie httpOnly; el frontend no lo guarda. */
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