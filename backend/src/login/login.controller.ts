import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { LoginService } from './login.service';
import { ValidateLoginDto } from './dto/validate-login.dto';
import { AuthGuard } from './login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() singIn: ValidateLoginDto, @Request() req) {
    const ip        = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.loginService.SignIn(singIn.Username, singIn.Contrasena, singIn.Clave, ip, userAgent);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Request() req) {
    const ip        = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.loginService.logout(req.user.sub, req.user.username, ip, userAgent);
  }
}
