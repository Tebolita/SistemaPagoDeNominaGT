import { Injectable, UnauthorizedException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';

@Injectable()
export class LoginService {
  constructor(
    private userService: UsuarioService,
    private jwtService: JwtService) {}

  async SignIn(username: string, contrasena: string, clave: number): Promise<any>{
    const user = await this.userService.findOne(username, contrasena, clave);
    if(user?.Contrasena !== contrasena || user?.Clave !== clave.toString()){
      throw new UnauthorizedException();
    }
    const payload = {sub: user.IdUsuario, username: user.Username};
    return {access_token: await this.jwtService.signAsync(payload)}
  }
}
