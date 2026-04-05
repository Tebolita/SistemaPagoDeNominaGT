import { Module } from '@nestjs/common';
import { LoginModule } from './login/login.module';
import { PrismaService } from './prisma/prisma.service';
import { UsuarioModule } from './usuario/usuario.module';
import { EmpleadoModule } from './empleado/empleado.module';

@Module({
  imports: [LoginModule, UsuarioModule, EmpleadoModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
