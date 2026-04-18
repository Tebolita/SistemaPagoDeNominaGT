import { Module } from '@nestjs/common';
import { LoginModule } from './login/login.module';
import { PrismaService } from './prisma/prisma.service';
import { UsuarioModule } from './usuario/usuario.module';
import { EmpleadoModule } from './empleado/empleado.module';
import { IncidenciaModule } from './incidencia/incidencia.module';
import { AsistenciaModule } from './asistencia/asistencia.module';
import { ControlvacacionModule } from './control-vacacion/controlvacacion.module';
import { DetallecontrolvacacionModule } from './detalle-control-vacacion/detallecontrolvacacion.module';
import { RolModule } from './rol/rol.module';

@Module({
  imports: [LoginModule, UsuarioModule, EmpleadoModule, IncidenciaModule, AsistenciaModule, ControlvacacionModule, DetallecontrolvacacionModule, RolModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
