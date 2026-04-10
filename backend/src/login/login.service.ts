import { Injectable, UnauthorizedException  } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class LoginService {
  constructor(
    private userService: UsuarioService,
    private jwtService: JwtService) {}

  async SignIn(username: string, contrasena: string, clave: number): Promise<any>{
    const user = await this.userService.findOne(username);
    console.log(user)
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isPasswordValid = await bcryptjs.compare(contrasena, user?.Contrasena!);
    const isClaveValid = await bcryptjs.compare(clave.toString(), user?.Clave!);
    
    if(!isPasswordValid || !isClaveValid){
      throw new UnauthorizedException();
    }
    const payload = {sub: user?.IdUsuario, username: user?.Username};
    return {access_token: await this.jwtService.signAsync(payload)}
  }
}
