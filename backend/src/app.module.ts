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
import { ReporteriaModule } from './reporteria/reporteria.module';
import { EstadoNominaModule } from './estado-nomina/estado-nomina.module';
import { ClienteModule } from './cliente/cliente.module';
import { ExportModule } from './export/export.module';
import { ProductoServicioModule } from './producto-servicio/producto-servicio.module';
import { VentaModule } from './venta/venta.module';
import { CuentaBancariaEmpresaModule } from './cuenta-bancaria-empresa/cuenta-bancaria-empresa.module';
import { MovimientoFinancieroModule } from './movimiento-financiero/movimiento-financiero.module';
import { CorreoModule } from './correo/correo.module';
import { ConfigFirmanteModule } from './config-firmante/config-firmante.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { ConfigEmpresaModule } from './config-empresa/config-empresa.module';
import { LiquidacionModule } from './liquidacion/liquidacion.module';
import { PrestamoModule } from './prestamo/prestamo.module';

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
    ReporteriaModule,
    EstadoNominaModule,
    ClienteModule,
    ExportModule,
    ProductoServicioModule,
    VentaModule,
    CuentaBancariaEmpresaModule,
    MovimientoFinancieroModule,
    CorreoModule,
    ConfigFirmanteModule,
    AuditoriaModule,
    ConfigEmpresaModule,
    LiquidacionModule,
    PrestamoModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
