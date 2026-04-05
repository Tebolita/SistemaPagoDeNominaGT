import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Get, Request } from '@nestjs/common';
import { LoginService } from './login.service';
import { ValidateLoginDto } from './dto/validate-login.dto';
import { AuthGuard } from './login.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() singIn: ValidateLoginDto){
    return this.loginService.SignIn(singIn.Username, singIn.Contrasena, singIn.Clave);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req){
    return req.user;
  }

}
