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
            {path: 'departamentos', component: DepartamentoComponent},
            {path: 'puestos', component: PuestoComponent},
            {path: 'jornadas', component: JornadaLaboralComponent},
            {path: 'bancos', component: BancoComponent},
            {path: 'parametros', component: ParametroGlobalComponent}
        ]
    },
    {
        path: 'nomina',
        component: Home,
        canActivate: [authGuard],
        children: [
            {path: 'generar', component: NominaComponent}
        ]
    },    
    { path: '**', redirectTo: 'login' }
];
