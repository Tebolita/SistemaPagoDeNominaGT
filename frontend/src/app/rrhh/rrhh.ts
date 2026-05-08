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
  selector: 'app-rrhh',
  standalone: true,
  imports: [RouterModule, ButtonModule, CardModule, BadgeModule, RippleModule, CommonModule],
  templateUrl: './rrhh.html',
  styleUrl: './rrhh.css'
})
export class RecursosHumanos {
  private router = inject(Router);

  modules: ModuleCard[] = [
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
    }
  ];

  navigate(route: string) {
    this.router.navigate([route]);
  }
}