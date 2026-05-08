import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { Empleado } from './empleado/empleado';
import { Vacacion } from './vacacion/vacacion';
import { Asistencia } from './asistencia/asistencia';
import { Inicio } from './inicio/inicio';
import { Usuario } from './usuario/usuario';
import { Seguridad } from './seguridad/seguridad';
import { RecursosHumanos } from './rrhh/rrhh';
import { Roles } from './roles/roles';
import { DepartamentoComponent } from './departamento/departamento';
import { PuestoComponent } from './puesto/puesto';
import { JornadaLaboralComponent } from './jornada-laboral/jornada-laboral';
import { BancoComponent } from './banco/banco';
import { ParametroGlobalComponent } from './parametro-global/parametro-global';
import { NominaComponent } from './nomina/nomina';
import { EstadoNominaComponent } from './estado-nomina/estado-nomina';
import { Reporteria } from './reporteria/reporteria';
import { ClienteComponent } from './cliente/cliente';
import { ProductoServicioComponent } from './producto-servicio/producto-servicio';
import { VentaComponent } from './ventas/venta';
import { VentaInicioComponent } from './ventas/venta-inicio/venta-inicio';
import { NominaInicio } from './nomina/nomina-inicio/nomina-inicio';
import { ReporteriaInicio } from './reporteria-inicio/reporteria-inicio';
import { ConfiguracionInicio } from './configuracion/configuracion-inicio/configuracion-inicio';
import { FinanzasInicioComponent } from './finanzas/finanzas-inicio/finanzas-inicio';
import { CuentaBancariaComponent } from './finanzas/cuenta-bancaria/cuenta-bancaria';
import { MovimientoFinancieroComponent } from './finanzas/movimiento-financiero/movimiento-financiero';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home/inicio', pathMatch: 'full' },
    
    {
        path: 'login',
        component: Login
    },
    {
        path: 'home', 
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'inicio', component: Inicio},
        ]
    },
    {
        path: 'recursoshumanos',
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'inicio', component: RecursosHumanos},
            {path: 'empleados', component: Empleado},
            {path: 'vacaciones', component: Vacacion},
            {path: 'asistencias', component: Asistencia},
        ]

    },
    {
        path: 'seguridad',
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'inicio', component: Seguridad},
            {path: 'usuarios', component: Usuario},
            {path: 'roles', component: Roles}
        ]

    },
    {
        path: 'configuracion',
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'inicio', component: ConfiguracionInicio},
            {path: 'departamentos', component: DepartamentoComponent},
            {path: 'puestos', component: PuestoComponent},
            {path: 'jornadas', component: JornadaLaboralComponent},
            {path: 'bancos', component: BancoComponent},
            {path: 'parametros', component: ParametroGlobalComponent},
            {path: 'estados-nomina', component: EstadoNominaComponent}
        ]
    },
    {
        path: 'nomina',
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'inicio', component: NominaInicio},
            {path: 'nominas', component: NominaComponent},
            {path: 'generar', component: NominaComponent}
        ]
    },
    {
        path: 'ventas',
        component: Home,
        canActivate: [authGuard],
        children: [
            { path: 'inicio', component: VentaInicioComponent },
            { path: 'clientes', component: ClienteComponent },
            { path: 'productos', component: ProductoServicioComponent }
        ]
    },
    {
        path: 'finanzas',
        component: Home,
        canActivate: [authGuard],
        children: [
            { path: 'inicio', component: FinanzasInicioComponent },
            { path: 'cuentas', component: CuentaBancariaComponent },
            { path: 'movimientos', component: MovimientoFinancieroComponent }
        ]
    },
    {
        path: 'reporteria',
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'inicio', component: ReporteriaInicio},
            {path: 'reportes', component: Reporteria},
            {path: '**', component: ReporteriaInicio}
        ]
    },
    { path: '**', redirectTo: 'login' }
];
