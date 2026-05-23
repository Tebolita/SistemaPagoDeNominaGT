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
  accent: string;
  features: string[];
}

@Component({
  selector: 'app-reporteria-inicio',
  standalone: true,
  imports: [RouterModule, ButtonModule, CardModule, BadgeModule, RippleModule, CommonModule],
  templateUrl: './reporteria-inicio.html',
  styleUrl: './reporteria-inicio.css',
})
export class ReporteriaInicio {
  private router = inject(Router);

  modules: ModuleCard[] = [
    {
      title: 'Reportes del Sistema',
      description: 'Genera y visualiza reportes detallados del sistema de nóminas y recursos humanos.',
      icon: 'pi pi-file-pdf',
      route: '/reporteria/reportes',
      status: 'active',
      color: 'blue', accent: '#3b82f6',
      features: [
        'Exportar a PDF',
        'Reportes personalizados',
        'Visualización de datos'
      ]
    },
    {
      title: 'Análisis de Salarios',
      description: 'Visualiza estadísticas de salarios promedio, rangos y distribuciones por puesto.',
      icon: 'pi pi-chart-bar',
      route: '/reporteria/salarios',
      status: 'active',
      color: 'teal', accent: '#14b8a6',
      features: [
        'Promedio y mediana salarial',
        'Distribución por rangos',
        'Análisis por departamento y puesto'
      ]
    },
    {
      title: 'Historiales',
      description: 'Consulta historiales completos de salarios, nóminas, asistencias y vacaciones.',
      icon: 'pi pi-history',
      route: '/reporteria/historiales',
      status: 'active',
      color: 'violet', accent: '#8b5cf6',
      features: [
        'Historial de salarios',
        'Nóminas por período',
        'Asistencias y vacaciones'
      ]
    },
    {
      title: 'Informes Ejecutivos',
      description: 'Dashboards con KPIs, gráficos de tendencias y análisis de la nómina.',
      icon: 'pi pi-chart-line',
      route: '/reporteria/ejecutivos',
      status: 'active',
      color: 'orange', accent: '#f97316',
      features: [
        'KPIs en tiempo real',
        'Gráficos interactivos',
        'Tendencia de nómina'
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
