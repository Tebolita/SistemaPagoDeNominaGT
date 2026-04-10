import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { Empleado } from './empleado/empleado';
import { Vacacion } from './vacacion/vacacion';
import { Asistencia } from './asistencia/asistencia';
import { Inicio } from './inicio/inicio';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'home', 
        component: Home,
        children: [
            {path: 'empleado', component: Empleado},
            {path: 'vacacion', component: Vacacion},
            {path: 'asistencia', component: Asistencia},
            {path: 'inicio', component: Inicio}
        ]
    },
    { path: '**', redirectTo: 'login' }
];
