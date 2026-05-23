import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { AuditoriaService } from 'src/auditoria/auditoria.service';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class LoginService {
  constructor(
    private userService: UsuarioService,
    private jwtService: JwtService,
    private auditoria: AuditoriaService,
  ) {}

  async SignIn(
    username: string,
    contrasena: string,
    clave: number,
    ip?: string,
    userAgent?: string,
  ): Promise<any> {
    const user = await this.userService.findOne(username);

    if (!user) {
      await this.auditoria.registrar({
        username,
        accion: 'LOGIN_FALLIDO',
        ip,
        userAgent,
        exitoso: false,
        detalle: 'Usuario no encontrado',
      });
      throw new UnauthorizedException('Tu usuario no es valido');
    }

    const isPasswordValid = await bcryptjs.compare(contrasena, user.Contrasena);
    const isClaveValid    = await bcryptjs.compare(clave.toString(), user.Clave!);

    if (!isPasswordValid || !isClaveValid) {
      await this.auditoria.registrar({
        idUsuario: user.IdUsuario,
        username:  user.Username,
        accion:    'LOGIN_FALLIDO',
        ip,
        userAgent,
        exitoso:   false,
        detalle:   'Contraseña o clave incorrecta',
      });
      throw new UnauthorizedException('Contraseña o usuario incorrecto');
    }

    await this.auditoria.registrar({
      idUsuario: user.IdUsuario,
      username:  user.Username,
      accion:    'LOGIN',
      ip,
      userAgent,
      exitoso:   true,
    });

    const payload = {
      sub:      user.IdUsuario,
      username: user.Username,
      role:     user.RolUsuario?.NombreRol,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      username:     payload.username,
      role:         payload.role,
    };
  }

  async logout(idUsuario: number, username: string, ip?: string, userAgent?: string) {
    await this.auditoria.registrar({
      idUsuario,
      username,
      accion:   'LOGOUT',
      ip,
      userAgent,
      exitoso:  true,
    });
    return { message: 'Sesión cerrada exitosamente' };
  }
}
