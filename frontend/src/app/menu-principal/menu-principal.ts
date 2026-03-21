import { Component, OnInit } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { Menu, MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-menu-principal',
  imports: [AvatarModule, BadgeModule, MenuModule, RippleModule],
  templateUrl: './menu-principal.html',
  styleUrl: './menu-principal.css',
})
export class MenuPrincipal implements OnInit {
  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      {
        separator: true,
      },
      {
        items: [
          {
            label: 'Inicio',
            icon: 'pi pi-home',
          },
        ],
      },
      {
        label: 'Recursos Humanos',
        items: [
          {
            label: 'Empleados',
            icon: 'pi pi-user',
          },
          {
            label: 'Puestos',
            icon: 'pi pi-id-card',
          },
          {
            label: 'Libro de salarios',
            icon: 'pi pi-book',
          },
          {
            label: 'Incidencias',
            icon: 'pi pi-pen-to-square',
          },
          {
            label: 'vacaciones',
            icon: 'pi pi-map',
          },
          {
            label: 'Marcajes',
            icon: 'pi pi-clock',
          },
        ],
      },
      {
        separator: true,
      },
      {
        label: 'Contabilidad',
        items: [
          {
            label: 'Descuentos por usuario',
            icon: 'pi pi-dollar',
          },
          {
            label: 'Messages',
            icon: 'pi pi-dollar',
            badge: '2',
          },
        ],
      },
      {
        separator: true,
      },
    ];
  }
}
