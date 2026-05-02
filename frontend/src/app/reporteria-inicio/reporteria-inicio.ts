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
      title: 'Reportes de Nómina',
      description: 'Genera reportes detallados de nóminas procesadas por período, departamento o empleado.',
      icon: 'pi pi-file-pdf',
      route: '/reporteria/nomina',
      status: 'coming',
      color: 'blue',
      features: [
        'Exportar a PDF',
        'Por período',
        'Filtrar por departamento'
      ]
    },
    {
      title: 'Análisis de Salarios',
      description: 'Visualiza estadísticas de salarios promedio, rangos y distribuciones por puesto.',
      icon: 'pi pi-chart-bar',
      route: '/reporteria/salarios',
      status: 'coming',
      color: 'teal',
      features: [
        'Promedio por puesto',
        'Distribución salarial',
        'Comparativas anuales'
      ]
    },
    {
      title: 'Historiales',
      description: 'Consulta historiales completos de empleados, cambios salariales y movimientos.',
      icon: 'pi pi-history',
      route: '/reporteria/historiales',
      status: 'coming',
      color: 'violet',
      features: [
        'Historial de cambios',
        'Movimientos de personal',
        'Archivos por año'
      ]
    },
    {
      title: 'Informes Ejecutivos',
      description: 'Dashboards y resúmenes ejecutivos con indicadores clave del sistema de nómina.',
      icon: 'pi pi-chart-line',
      route: '/reporteria/ejecutivos',
      status: 'coming',
      color: 'orange',
      features: [
        'KPIs del sistema',
        'Gráficos interactivos',
        'Descargar reportes'
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
