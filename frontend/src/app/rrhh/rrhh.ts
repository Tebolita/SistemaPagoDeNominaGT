import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rrhh',
  standalone: true,
  templateUrl: './rrhh.html',
  styleUrls: ['./rrhh.css']
})
export class RecursosHumanos {
  private router = inject(Router);

  subModules = [
    {
      title: 'Expedientes de Empleados',
      description: 'Gestión completa de los datos personales, contratos y asignación bancaria.',
      icon: 'pi pi-id-card',
      color: 'blue', 
      route: '/recursoshumanos/empleados',
      status: 'active',
      features: [
        'Registro de DPI y NIT',
        'Asignación de Puesto y Jornada',
        'Histórico de Salarios'
      ]
    },
    {
      title: 'Control de Vacaciones',
      description: 'Cálculo de días ganados y registro de días gozados por año laborado.',
      icon: 'pi pi-sun',
      color: 'orange',
      route: '/recursoshumanos/vacaciones',
      status: 'active',
      features: [
        'Saldo de días disponibles',
        'Descuento por medios días',
        'Control anual por empleado'
      ]
    },    
    {
      title: 'Asistencia e Incidencias',
      description: 'Control de ingresos, horas extra, permisos y suspensiones del IGSS.',
      icon: 'pi pi-calendar-clock',
      color: 'teal',
      route: '/recursoshumanos/asistencias',
      status: 'active',
      features: [
        'Registro de Entrada/Salida',
        'Cálculo de Horas Extra',
        'Justificación de Faltas'
      ]
    },
    {
      title: 'Estructura Organizativa',
      description: 'Mantenimiento de los catálogos de departamentos, puestos y jornadas.',
      icon: 'pi pi-sitemap',
      color: 'violet',
      route: '/recursoshumanos/estructura',
      status: 'coming',
      features: [
        'Creación de Departamentos',
        'Definición de Puestos',
        'Configuración de Jornadas'
      ]
    },
  ];

  navigate(route: string) {
    const modulo = this.subModules.find(m => m.route === route);
    if (modulo && modulo.status === 'active') {
      this.router.navigate([route]);
    }
  }
}