import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { MenuItem } from 'primeng/api';
import { Divider } from 'primeng/divider';
import { RouterModule, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginService } from '../services/login.service';
import { ConfigEmpresaService, ConfigEmpresa } from '../services/config-empresa.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AvatarModule, BadgeModule, MenuModule, RippleModule, Divider, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class MenuPrincipal implements OnInit, OnDestroy {
  @ViewChild('menuCard') menuCard!: ElementRef<HTMLDivElement>;

  items: MenuItem[] | undefined;
  avatarItems: MenuItem[] | undefined;

  username = signal('Usuario');
  role     = signal('');
  initials = signal('U');

  private authService      = inject(LoginService);
  private configEmpresaSvc = inject(ConfigEmpresaService);
  readonly router          = inject(Router);

  empresa = signal<ConfigEmpresa | null>(null);
  private routerSub!: Subscription;
  private savedScroll    = 0;

  ngOnInit() {
    this.loadUserInfo();
    this.buildMenu();
    this.buildAvatarMenu();
    this.watchNavigation();
    this.configEmpresaSvc.get().subscribe({
      next: (data) => this.empresa.set(data),
      error: () => {},
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private watchNavigation() {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.savedScroll = this.menuCard?.nativeElement?.scrollTop ?? 0;
      }
      if (event instanceof NavigationEnd) {
        setTimeout(() => {
          if (this.menuCard?.nativeElement) {
            this.menuCard.nativeElement.scrollTop = this.savedScroll;
          }
        }, 0);
      }
    });
  }

  private loadUserInfo() {
    const stored = localStorage.getItem('username') ?? '';
    const role   = localStorage.getItem('user_role') ?? '';
    this.username.set(stored || 'Usuario');
    this.role.set(role);
    this.initials.set(this.calcInitials(stored));
  }

  private calcInitials(name: string): string {
    return name
      .split(/[._\s\-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('') || 'U';
  }

  isActive(route: string): boolean {
    if (!route) return false;
    return this.router.isActive(route, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  getRoleSeverity(): 'info' | 'success' | 'warn' | 'danger' | 'secondary' {
    const r = this.role().toUpperCase();
    if (r === 'ADMINISTRADOR' || r === 'ADMIN') return 'danger';
    if (r === 'GERENTE') return 'warn';
    if (r === 'RRHH' || r.includes('RECURSOS')) return 'info';
    return 'secondary';
  }

  // Mismo criterio que roleGuard en app.routes.ts
  private hasRole(allowed: string[]): boolean {
    const r = this.role().trim().toUpperCase().replace(/\s+/g, '_');
    return allowed.some(a => a.toUpperCase().replace(/\s+/g, '_') === r);
  }

  private get isAdmin()    { return this.hasRole(['ADMINISTRADOR', 'ADMIN']); }
  private get isRRHH()     { return this.hasRole(['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS_HUMANOS', 'RECURSOS HUMANOS']); }
  private get isGerente()  { return this.hasRole(['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS_HUMANOS', 'RECURSOS HUMANOS']); }
  private get isFinanzas() { return this.hasRole(['ADMINISTRADOR', 'ADMIN', 'GERENTE']); }

  private buildMenu() {
    const menu: MenuItem[] = [
      { separator: true },
      { items: [{ label: 'Inicio', icon: 'pi pi-home', routerLink: '/home/inicio' }] },
      { separator: true },

      // Reportería — todos los autenticados
      {
        label: 'Reportería',
        items: [
          { label: 'Inicio',             icon: 'pi pi-home',       routerLink: '/reporteria/inicio'      },
          { label: 'Reportes',           icon: 'pi pi-chart-bar',  routerLink: '/reporteria/reportes'    },
          { label: 'Análisis de Salarios', icon: 'pi pi-dollar',     routerLink: '/reporteria/salarios'    },
          { label: 'Historiales',          icon: 'pi pi-history',    routerLink: '/reporteria/historiales' },
          { label: 'Informes Ejecutivos',  icon: 'pi pi-chart-line', routerLink: '/reporteria/ejecutivos'  },
        ],
      },

      // Seguridad — solo ADMIN
      ...(this.isAdmin ? [{
        label: 'Seguridad',
        items: [
          { label: 'Inicio',     icon: 'pi pi-home',       routerLink: '/seguridad/inicio'     },
          { label: 'Usuarios',   icon: 'pi pi-user',       routerLink: '/seguridad/usuarios'   },
          { label: 'Roles',      icon: 'pi pi-shield',     routerLink: '/seguridad/roles'      },
          { label: 'Auditoría',  icon: 'pi pi-list-check', routerLink: '/seguridad/auditoria'  },
          { label: 'Mi Perfil',  icon: 'pi pi-id-card',    routerLink: '/seguridad/perfil'     },
        ],
      }] : []),

      // Recursos Humanos — ADMIN + RRHH
      ...(this.isRRHH ? [{
        label: 'Recursos Humanos',
        items: [
          { label: 'Inicio',      icon: 'pi pi-home',  routerLink: '/recursoshumanos/inicio'      },
          { label: 'Empleados',    icon: 'pi pi-user',          routerLink: '/recursoshumanos/empleados'    },
          { label: 'Vacaciones',   icon: 'pi pi-sun',           routerLink: '/recursoshumanos/vacaciones'   },
          { label: 'Asistencias',  icon: 'pi pi-clock',         routerLink: '/recursoshumanos/asistencias'  },
          { label: 'Prestaciones', icon: 'pi pi-calculator',    routerLink: '/recursoshumanos/prestaciones' },
          { label: 'Préstamos',    icon: 'pi pi-credit-card',   routerLink: '/recursoshumanos/prestamos'    },
        ],
      }] : []),

      // Configuración — ADMIN + RRHH
      ...(this.isRRHH ? [{
        label: 'Configuración',
        items: [
          { label: 'Inicio',              icon: 'pi pi-home',       routerLink: '/configuracion/inicio'         },
          { label: 'Departamentos',       icon: 'pi pi-building',   routerLink: '/configuracion/departamentos'  },
          { label: 'Puestos',             icon: 'pi pi-briefcase',  routerLink: '/configuracion/puestos'        },
          { label: 'Jornadas Laborales',  icon: 'pi pi-calendar',   routerLink: '/configuracion/jornadas'       },
          { label: 'Bancos',              icon: 'pi pi-money-bill', routerLink: '/configuracion/bancos'         },
          { label: 'Parámetros Globales', icon: 'pi pi-sliders-h',  routerLink: '/configuracion/parametros'     },
          { label: 'Estados de Nómina',   icon: 'pi pi-tags',       routerLink: '/configuracion/estados-nomina' },
          { label: 'Firmantes Nómina',    icon: 'pi pi-pen-to-square', routerLink: '/configuracion/firmantes' },
          { label: 'Datos de Empresa',    icon: 'pi pi-building',      routerLink: '/configuracion/empresa'   },
        ],
      }] : []),

      // Nómina — ADMIN + RRHH + GERENTE
      ...(this.isGerente ? [{
        label: 'Nómina',
        items: [
          { label: 'Inicio',         icon: 'pi pi-home',         routerLink: '/nomina/inicio'   },
          { label: 'Generar Nómina', icon: 'pi pi-calculator',  routerLink: '/nomina/nominas'  },
          { label: 'Detalle Nómina', icon: 'pi pi-list-check',  routerLink: '/nomina/detalles' },
        ],
      }] : []),

      // Ventas — ADMIN + GERENTE
      ...(this.isFinanzas ? [{
        label: 'Ventas',
        items: [
          { label: 'Inicio',              icon: 'pi pi-home',          routerLink: '/ventas/inicio'    },
          { label: 'Ventas',              icon: 'pi pi-shopping-cart', routerLink: '/ventas/ventas'   },
          { label: 'Clientes',            icon: 'pi pi-users',         routerLink: '/ventas/clientes'  },
          { label: 'Productos/Servicios', icon: 'pi pi-box',           routerLink: '/ventas/productos' },
        ],
      }] : []),

      // Finanzas — ADMIN + GERENTE
      ...(this.isFinanzas ? [{
        label: 'Finanzas',
        items: [
          { label: 'Inicio',            icon: 'pi pi-home',                   routerLink: '/finanzas/inicio'      },
          { label: 'Cuentas Bancarias', icon: 'pi pi-building',               routerLink: '/finanzas/cuentas'     },
          { label: 'Movimientos',       icon: 'pi pi-arrow-right-arrow-left', routerLink: '/finanzas/movimientos' },
        ],
      }] : []),

      { separator: true },
    ];

    this.items = menu;
  }

  private buildAvatarMenu() {
    this.avatarItems = [
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-sign-out',
        styleClass: '!text-red-500',
        command: () => this.onSalir(),
      },
    ];
  }

  onSalir(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('username');
        this.router.navigate(['/login']);
      },
    });
  }
}
