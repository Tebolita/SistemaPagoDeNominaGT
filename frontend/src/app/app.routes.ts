import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { Empleado } from './empleado/empleado';

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
            {path:'empleado', component: Empleado}
        ]
    },
    { path: '**', redirectTo: 'login' }
];
