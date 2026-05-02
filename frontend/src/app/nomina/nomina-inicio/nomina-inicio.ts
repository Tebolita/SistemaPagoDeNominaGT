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
  selector: 'app-nomina-inicio',
  standalone: true,
  imports: [RouterModule, ButtonModule, CardModule, BadgeModule, RippleModule, CommonModule],
  templateUrl: './nomina-inicio.html',
  styleUrl: './nomina-inicio.css',
})
export class NominaInicio {
  private router = inject(Router);

  modules: ModuleCard[] = [
    {
      title: 'Crear Nómina',
      description: 'Crea nuevas nóminas para períodos específicos y gestiona el estado de cada una.',
      icon: 'pi pi-file-edit',
      route: '/nomina/nominas',
      status: 'active',
      color: 'blue',
      features: [
        'Crear nueva nómina',
        'Cargar datos de empleados',
        'Generar estado GENERADA'
      ]
    },
    {
      title: 'Estados de Nómina',
      description: 'Administra el flujo de estados: GENERADA, PENDIENTE APROBACIÓN, APROBADA, PROCESADA.',
      icon: 'pi pi-tags',
      route: '/configuracion/estados-nomina',
      status: 'active',
      color: 'teal',
      features: [
        'Cambiar estado',
        'Ver historial',
        'Validar transiciones'
      ]
    },
    {
      title: 'Detalle de Nómina',
      description: 'Visualiza y edita los detalles de cada empleado dentro de una nómina procesada.',
      icon: 'pi pi-list-check',
      route: '/nomina/detalles',
      status: 'coming',
      color: 'violet',
      features: [
        'Sueldos y salarios',
        'Deducciones',
        'Bonificaciones'
      ]
    },
    {
      title: 'Reportería',
      description: 'Genera reportes de nóminas, análisis de salarios y comparativas históricas.',
      icon: 'pi pi-chart-bar',
      route: '/reporteria',
      status: 'coming',
      color: 'orange',
      features: [
        'Reportes de nómina',
        'Análisis de salarios',
        'Gráficos comparativos'
      ]
    }
  ];

  navigate(route: string) {
    const modulo = this.modules.find(m => m.route === route);
    if (modulo && modulo.status === 'active') {
      this.router.navigate([route]);
    }
  }
}
