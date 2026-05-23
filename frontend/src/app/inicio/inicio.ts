import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';

interface ModuleCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  accent: string;
  features: string[];
  roles: string[];
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterModule, ButtonModule, RippleModule, CommonModule, TagModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  username = '';
  role     = '';
  greeting = '';

  constructor(private router: Router) {}

  private readonly ALL_MODULES: ModuleCard[] = [
    // ── Reportería — todos ─────────────────────────────────────────
    {
      title: 'Reportería',
      description: 'Resumen ejecutivo, KPIs y exportaciones de todos los módulos del sistema.',
      icon: 'pi pi-chart-bar', route: '/reporteria/reportes', color: 'sky', accent: '#0ea5e9', roles: [],
      features: ['Resumen ejecutivo', 'Gráficas y KPIs', 'Exportar Excel/PDF'],
    },

    // ── Seguridad — solo ADMIN ─────────────────────────────────────
    {
      title: 'Usuarios',
      description: 'Crea y administra los accesos al sistema para cada empleado.',
      icon: 'pi pi-user-edit', route: '/seguridad/usuarios', color: 'red', accent: '#ef4444',
      roles: ['ADMINISTRADOR', 'ADMIN'],
      features: ['Gestión de credenciales', 'Asignación de roles', 'Control de accesos'],
    },
    {
      title: 'Roles y Permisos',
      description: 'Define los niveles de acceso y a qué módulos puede entrar cada rol.',
      icon: 'pi pi-sitemap', route: '/seguridad/roles', color: 'red', accent: '#ef4444',
      roles: ['ADMINISTRADOR', 'ADMIN'],
      features: ['Creación de roles', 'Permisos por módulo', 'Jerarquía de accesos'],
    },

    // ── Recursos Humanos — ADMIN + RRHH ───────────────────────────
    {
      title: 'Empleados',
      description: 'Gestión completa del personal: altas, bajas y consulta de información.',
      icon: 'pi pi-users', route: '/recursoshumanos/empleados', color: 'blue', accent: '#3b82f6',
      roles: ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'],
      features: ['Registro de empleados', 'Historial salarial', 'Gestión de puestos'],
    },
    {
      title: 'Vacaciones',
      description: 'Control de solicitudes de descanso con o sin goce de sueldo.',
      icon: 'pi pi-sun', route: '/recursoshumanos/vacaciones', color: 'teal', accent: '#14b8a6',
      roles: ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'],
      features: ['Solicitudes de vacaciones', 'Goce de sueldo', 'Historial por empleado'],
    },
    {
      title: 'Asistencias',
      description: 'Registro diario de entradas, salidas y horas extras del personal.',
      icon: 'pi pi-clock', route: '/recursoshumanos/asistencias', color: 'violet', accent: '#8b5cf6',
      roles: ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'],
      features: ['Registro de entrada/salida', 'Horas extra', 'Reportes de asistencia'],
    },

    // ── Configuración — ADMIN + RRHH ──────────────────────────────
    {
      title: 'Configuración',
      description: 'Departamentos, puestos, jornadas, bancos y parámetros del sistema.',
      icon: 'pi pi-cog', route: '/configuracion/inicio', color: 'slate', accent: '#94a3b8',
      roles: ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'],
      features: ['Departamentos y puestos', 'Jornadas laborales', 'Parámetros globales'],
    },
    {
      title: 'Estados de Nómina',
      description: 'Configura el flujo de aprobación de nóminas del sistema.',
      icon: 'pi pi-tags', route: '/configuracion/estados-nomina', color: 'slate', accent: '#94a3b8',
      roles: ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'],
      features: ['Flujo de aprobación', 'Requiere aprobación', 'Historial de cambios'],
    },

    // ── Nómina — ADMIN + RRHH + GERENTE ──────────────────────────
    {
      title: 'Nómina',
      description: 'Generación masiva de planillas con cálculos de ley guatemalteca.',
      icon: 'pi pi-calculator', route: '/nomina/nominas', color: 'green', accent: '#22c55e',
      roles: ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS HUMANOS'],
      features: ['Cálculo IGSS / ISR', 'Bono 14 y Aguinaldo', 'Doble firma y estados'],
    },

    // ── Ventas / Finanzas — ADMIN + GERENTE ──────────────────────
    {
      title: 'Ventas',
      description: 'Clientes, productos/servicios y control de facturación.',
      icon: 'pi pi-shopping-cart', route: '/ventas/inicio', color: 'orange', accent: '#f97316',
      roles: ['ADMINISTRADOR', 'ADMIN', 'GERENTE'],
      features: ['Gestión de clientes', 'Catálogo de productos', 'Estados de pago'],
    },
    {
      title: 'Finanzas',
      description: 'Cuentas bancarias de la empresa y movimientos financieros.',
      icon: 'pi pi-building-columns', route: '/finanzas/inicio', color: 'yellow', accent: '#eab308',
      roles: ['ADMINISTRADOR', 'ADMIN', 'GERENTE'],
      features: ['Cuentas bancarias', 'Movimientos ingreso/egreso', 'Balance general'],
    },
  ];

  get modules(): ModuleCard[] {
    return this.ALL_MODULES.filter(m => this.canAccess(m.roles));
  }

  private canAccess(roles: string[]): boolean {
    if (roles.length === 0) return true;
    const r = this.role.trim().toUpperCase().replace(/\s+/g, '_');
    return roles.some(a => a.toUpperCase().replace(/\s+/g, '_') === r);
  }

  ngOnInit() {
    this.username = localStorage.getItem('username') ?? 'Usuario';
    this.role     = localStorage.getItem('user_role') ?? '';
    this.greeting = this.buildGreeting();
  }

  private buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getRoleLabel(): string {
    const r = this.role.toUpperCase();
    if (r === 'ADMINISTRADOR' || r === 'ADMIN') return 'Administrador';
    if (r === 'GERENTE') return 'Gerente';
    if (r.includes('RRHH') || r.includes('RECURSOS')) return 'Recursos Humanos';
    return this.role || 'Usuario';
  }

  getRoleSeverity(): 'danger' | 'warn' | 'info' | 'secondary' {
    const r = this.role.toUpperCase();
    if (r === 'ADMINISTRADOR' || r === 'ADMIN') return 'danger';
    if (r === 'GERENTE') return 'warn';
    if (r.includes('RRHH') || r.includes('RECURSOS')) return 'info';
    return 'secondary';
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
