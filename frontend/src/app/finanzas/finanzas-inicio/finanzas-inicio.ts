import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface ModuleCard {
  title: string; description: string; icon: string;
  route: string; status: 'active' | 'coming'; color: string; features: string[];
}

@Component({
  selector: 'app-finanzas-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './finanzas-inicio.html',
  styleUrl: './finanzas-inicio.css',
})
export class FinanzasInicioComponent {
  constructor(private router: Router) {}

  modules: ModuleCard[] = [
    {
      title: 'Cuentas Bancarias',
      description: 'Administra las cuentas bancarias de la empresa, saldos y datos de cada banco.',
      icon: 'pi pi-building-columns', route: '/finanzas/cuentas', status: 'active', color: 'blue',
      features: ['Gestión de cuentas', 'Control de saldos', 'Múltiples bancos'],
    },
    {
      title: 'Movimientos Financieros',
      description: 'Registra ingresos y egresos con categoría y cuenta bancaria asociada.',
      icon: 'pi pi-arrow-right-arrow-left', route: '/finanzas/movimientos', status: 'active', color: 'teal',
      features: ['Ingresos y egresos', 'Categorías', 'Balance por cuenta'],
    },
    {
      title: 'Reportes Financieros',
      description: 'Próximamente: estados financieros, flujo de caja y análisis de capital.',
      icon: 'pi pi-chart-bar', route: '/finanzas/reportes', status: 'coming', color: 'yellow',
      features: ['Estado financiero', 'Flujo de caja', 'Análisis de capital'],
    },
  ];

  navigate(route: string) { this.router.navigate([route]); }
}
