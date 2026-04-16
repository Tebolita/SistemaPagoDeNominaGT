import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-seguridad-dashboard',
  standalone: true,
  templateUrl: './seguridad.html',
  styleUrls: ['./seguridad.css'] // Asumiendo que aquí tienes tu CSS
})
export class Seguridad {
  private router = inject(Router);

  subModules = [
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
      status: 'coming',
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
    // Evitar navegación si está en desarrollo
    const modulo = this.subModules.find(m => m.route === route);
    if (modulo && modulo.status === 'active') {
      this.router.navigate([route]);
    }
  }
}