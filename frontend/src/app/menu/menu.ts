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

  private authService    = inject(LoginService);
  readonly router        = inject(Router);
  private routerSub!: Subscription;
  private savedScroll    = 0;

  ngOnInit() {
    this.loadUserInfo();
    this.buildMenu();
    this.buildAvatarMenu();
    this.watchNavigation();
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

  private buildMenu() {
    this.items = [
      { separator: true },
      {
        items: [{ label: 'Inicio', icon: 'pi pi-home', routerLink: '/home/inicio' }],
      },
      { separator: true },
      {
        label: 'Reportería',
        items: [
          { label: 'Inicio',   icon: 'pi pi-home',      routerLink: '/reporteria/inicio'   },
          { label: 'Reportes', icon: 'pi pi-chart-bar',  routerLink: '/reporteria/reportes' },
        ],
      },
      {
        label: 'Seguridad',
        items: [
          { label: 'Inicio',   icon: 'pi pi-home',  routerLink: '/seguridad/inicio'   },
          { label: 'Usuarios', icon: 'pi pi-user',  routerLink: '/seguridad/usuarios' },
          { label: 'Roles',    icon: 'pi pi-users', routerLink: '/seguridad/roles'    },
        ],
      },
      {
        label: 'Recursos Humanos',
        items: [
          { label: 'Inicio',       icon: 'pi pi-home',  routerLink: '/recursoshumanos/inicio'      },
          { label: 'Empleados',    icon: 'pi pi-user',  routerLink: '/recursoshumanos/empleados'   },
          { label: 'Vacaciones',   icon: 'pi pi-sun',   routerLink: '/recursoshumanos/vacaciones'  },
          { label: 'Asistencias',  icon: 'pi pi-clock', routerLink: '/recursoshumanos/asistencias' },
        ],
      },
      {
        label: 'Configuración',
        items: [
          { label: 'Inicio',             icon: 'pi pi-home',       routerLink: '/configuracion/inicio'          },
          { label: 'Departamentos',      icon: 'pi pi-building',   routerLink: '/configuracion/departamentos'   },
          { label: 'Puestos',            icon: 'pi pi-briefcase',  routerLink: '/configuracion/puestos'         },
          { label: 'Jornadas Laborales', icon: 'pi pi-calendar',   routerLink: '/configuracion/jornadas'        },
          { label: 'Bancos',             icon: 'pi pi-money-bill', routerLink: '/configuracion/bancos'          },
          { label: 'Parámetros Globales',icon: 'pi pi-sliders-h',  routerLink: '/configuracion/parametros'      },
          { label: 'Estados de Nómina',  icon: 'pi pi-tags',       routerLink: '/configuracion/estados-nomina'  },
        ],
      },
      {
        label: 'Ventas',
        items: [
          { label: 'Inicio',              icon: 'pi pi-home',  routerLink: '/ventas/inicio'    },
          { label: 'Clientes',            icon: 'pi pi-users', routerLink: '/ventas/clientes'  },
          { label: 'Productos/Servicios', icon: 'pi pi-box',   routerLink: '/ventas/productos' },
        ],
      },
      {
        label: 'Finanzas',
        items: [
          { label: 'Inicio',           icon: 'pi pi-home',                   routerLink: '/finanzas/inicio'      },
          { label: 'Cuentas Bancarias',icon: 'pi pi-building',               routerLink: '/finanzas/cuentas'     },
          { label: 'Movimientos',      icon: 'pi pi-arrow-right-arrow-left', routerLink: '/finanzas/movimientos' },
        ],
      },
      {
        label: 'Nómina',
        items: [
          { label: 'Inicio',         icon: 'pi pi-home',       routerLink: '/nomina/inicio'  },
          { label: 'Generar Nómina', icon: 'pi pi-calculator', routerLink: '/nomina/nominas' },
        ],
      },
      { separator: true },
    ];
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
