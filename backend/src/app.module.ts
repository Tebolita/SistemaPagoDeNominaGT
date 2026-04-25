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
import { DepartamentoModule } from './departamento/departamento.module';
import { PuestoModule } from './puesto/puesto.module';
import { JornadaLaboralModule } from './jornada-laboral/jornada-laboral.module';
import { BancoModule } from './banco/banco.module';
import { ParametroGlobalModule } from './parametro-global/parametro-global.module';
import { NominaModule } from './nomina/nomina.module';
import { SalarioModule } from './salario/salario.module';

@Module({
  imports: [
    LoginModule,
    UsuarioModule,
    EmpleadoModule,
    IncidenciaModule,
    AsistenciaModule,
    ControlvacacionModule,
    DetallecontrolvacacionModule,
    RolModule,
    DepartamentoModule,
    PuestoModule,
    JornadaLaboralModule,
    BancoModule,
    ParametroGlobalModule,
    NominaModule,
    SalarioModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
