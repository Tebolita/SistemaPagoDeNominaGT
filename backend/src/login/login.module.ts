import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsuarioModule } from 'src/usuario/usuario.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuditoriaModule } from 'src/auditoria/auditoria.module';

@Module({
  imports: [
    UsuarioModule,
    AuditoriaModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [LoginController],
  providers: [LoginService, PrismaService],
})
export class LoginModule {}
