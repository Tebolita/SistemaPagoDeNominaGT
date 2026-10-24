import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import {
  CABECERA_ANTI_CSRF,
  COOKIE_SESION,
  leerCookie,
  METODOS_SEGUROS,
} from 'src/common/sesion-cookie';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // El guard está registrado de forma global; solo las rutas con @Public() quedan abiertas
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // 1) Authorization: Bearer (clientes de API, pruebas automatizadas)  2) cookie httpOnly (navegador)
    const tokenCabecera = this.extractTokenFromHeader(request);
    const token = tokenCabecera ?? leerCookie(request, COOKIE_SESION);
    if (!token) {
      throw new UnauthorizedException();
    }
    // Defensa CSRF: con sesión por cookie, una petición que modifica datos debe traer una cabecera
    // que un formulario de otro sitio no puede añadir sin pasar por CORS
    if (!tokenCabecera && !METODOS_SEGUROS.has(request.method) && !request.headers?.[CABECERA_ANTI_CSRF]) {
      throw new ForbiddenException('Falta la cabecera X-Requested-With');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
