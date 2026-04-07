import { Component, OnInit } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { Divider } from 'primeng/divider';
import { RouterModule } from '@angular/router';

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

    ngOnInit() {
        this.items = [ 
            {
                separator: true
            },           
            {
                label: 'Recursos Humanos',
                items: [
                    {
                        label: 'Empleados',
                        icon: 'pi pi-user',
                        routerLink: '/home/empleado'
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
                styleClass: '!text-red-500 dark:!text-red-400'
            }
        ];
    }
}
