import { Component, OnInit, inject } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { MenuItem, MessageService } from 'primeng/api';
import { Divider } from 'primeng/divider';
import { RouterModule } from '@angular/router';
import { LoginService } from '../services/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [AvatarModule, BadgeModule, MenuModule, RippleModule,  Divider, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuPrincipal implements OnInit {
    items: MenuItem[] | undefined;
    avatarItems: MenuItem[] | undefined;

    private authService = inject(LoginService);
    private router = inject(Router);

    ngOnInit() {
        this.items = [ 
            {
                separator: true
            },
            {
                items: [
                    {
                        label: 'Inicio',
                        icon: 'pi pi-home',
                        routerLink: '/home/inicio'
                    }
                ]
            }, 
            {
                separator: true
            },
            {
                label: 'Seguridad',
                items: [
                    {
                        label: 'Inicio',
                        icon: 'pi pi-home',
                        routerLink: '/seguridad/inicio'
                    } ,
                    {
                        label: 'Usuarios',
                        icon: 'pi pi-user',
                        routerLink: '/seguridad/usuarios'
                    },   

                ]      
            },
            {
                label: 'Recursos Humanos',
                items: [
                    {
                        label: 'Inicio',
                        icon: 'pi pi-home',
                        routerLink: '/recursoshumanos/inicio'
                    },
                    {
                        label: 'Empleados',
                        icon: 'pi pi-user',
                        routerLink: '/recursoshumanos/empleados'
                    },
                    {
                        label: 'Vacaciones',
                        icon: 'pi pi-sun',
                        routerLink: '/recursoshumanos/vacaciones'
                    },
                    {
                        label: 'Asistencias',
                        icon: 'pi pi-clock',
                        routerLink: '/recursoshumanos/asistencias'
                    },
                ]
            },
            {
                separator: true
            }
        ];

        this.avatarItems = [
            {
                label: 'Editar',
                icon: 'pi pi-cog'
            },
            {
                label: 'Cerrar Sesión',
                icon: 'pi pi-sign-out',
                styleClass: '!text-red-500 dark:!text-red-400',
                command: () => this.onSalir()
            }
        ];
    }

    onSalir(): void {
        this.authService.logout().subscribe({
        next: (res) => {
        // Destruir el token
        localStorage.removeItem('access_token'); 
        // Redirigir al login
        this.router.navigate(['/login']);
        }
    });
  }
}
