import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { COOKIE_SESION, opcionesCookieSesion } from 'src/common/sesion-cookie';
import { LoginService } from './login.service';
import { ValidateLoginDto } from './dto/validate-login.dto';
import { AuthGuard } from './login.guard';
import { Public } from './public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { RequestConUsuario } from 'src/common/request-con-usuario';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Public()
  // Máximo 10 intentos de login por minuto y por IP (LOGIN_THROTTLE_LIMIT), además del bloqueo por cuenta
  @Throttle({ default: { limit: Number(process.env.LOGIN_THROTTLE_LIMIT ?? 10), ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() singIn: ValidateLoginDto,
    @Request() req: RequestConUsuario,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Con 'trust proxy', Express resuelve la IP real desde X-Forwarded-For
    const ip        = req.ip;
    const userAgent = req.headers['user-agent'];
    const sesion = await this.loginService.SignIn(singIn.Username, singIn.Contrasena, singIn.Clave, ip, userAgent);
    // El navegador guarda el JWT en una cookie httpOnly; el cuerpo lo conserva para clientes de API
    res.cookie(COOKIE_SESION, sesion.access_token, opcionesCookieSesion());
    return sesion;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestConUsuario) {
    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: RequestConUsuario, @Res({ passthrough: true }) res: Response) {
    // Con 'trust proxy', Express resuelve la IP real desde X-Forwarded-For
    const ip        = req.ip;
    const userAgent = req.headers['user-agent'];
    const { maxAge: _maxAge, ...opciones } = opcionesCookieSesion();
    res.clearCookie(COOKIE_SESION, opciones);
    return this.loginService.logout(req.user!.sub, req.user!.username, ip, userAgent);
  }
}
