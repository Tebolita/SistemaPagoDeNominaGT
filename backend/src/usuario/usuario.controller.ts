import { Controller, Post, Body, UseGuards} from '@nestjs/common';
import { AuthGuard } from 'src/login/login.guard';
import { UsuarioService } from './usuario.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateUsuarioDto } from './dto/create-usuario.dto';


@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post('CrearUsuario')
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }

}
