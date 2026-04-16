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

export const routes: Routes = [
    { path: '', redirectTo: 'home/inicio', pathMatch: 'full' },
    
    {
        path: 'login',
        component: Login
    },
    {
        path: 'home', 
        component: Home,
        children: [
            {path: 'inicio', component: Inicio},
        ]
    },
    {
        path: 'recursoshumanos',
        component: Home,
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
        children: [
            {path: 'inicio', component: Seguridad},
            {path: 'usuarios', component: Usuario},
        ]

    },    
    { path: '**', redirectTo: 'login' }
];
