import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { CommonModule } from '@angular/common';

interface ModuleCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'coming';
  color: string;
  features: string[];
}

@Component({
  selector: 'app-seguridad-dashboard',
  standalone: true,
  imports: [RouterModule, ButtonModule, CardModule, BadgeModule, RippleModule, CommonModule],
  templateUrl: './seguridad.html',
  styleUrl: './seguridad.css'
})
export class Seguridad {
  private router = inject(Router);

  modules: ModuleCard[] = [
    {
      title: 'Usuarios del Sistema',
      description: 'Crea, edita y elimina los accesos para los empleados de la empresa.',
      icon: 'pi pi-user-edit',
      color: 'blue',
      route: '/seguridad/usuarios',
      status: 'active',
      features: [
        'Gestión de credenciales',
        'Asignación a empleados',
        'Reseteo de claves numéricas'
      ]
    },
    {
      title: 'Roles y Permisos',
      description: 'Define los niveles de jerarquía y a qué pantallas puede acceder cada rol.',
      icon: 'pi pi-sitemap',
      color: 'teal',
      route: '/seguridad/roles',
      status: 'active',
      features: [
        'Creación de nuevos roles',
        'Control de accesos',
        'Jerarquía del sistema'
      ]
    },
    {
      title: 'Auditoría de Sesiones',
      description: 'Registro histórico de quién entró al sistema y qué acciones realizó.',
      icon: 'pi pi-list',
      color: 'violet',
      route: '/seguridad/auditoria',
      status: 'coming',
      features: [
        'Logs de inicio de sesión',
        'Rastreo de IPs',
        'Historial de modificaciones'
      ]
    }
  ];

  navigate(route: string) {
    this.router.navigate([route]);
  }
}