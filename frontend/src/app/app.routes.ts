import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { ROLES_NOMINA, ROLES_RRHH, ROLES_SEGURIDAD, ROLES_VENTAS_FINANZAS } from './roles-acceso';

// Roles por módulo: definidos en roles-acceso.ts, compartidos con el menú lateral.
// Las pantallas se cargan bajo demanda (loadComponent): el bundle inicial solo trae login y el
// armazón, lo que reduce el tiempo de la primera carga (ISO 25010 – Eficiencia de desempeño).

export const routes: Routes = [
    { path: '', redirectTo: 'home/inicio', pathMatch: 'full' },
    { path: 'login', component: Login },

    {
        path: 'home',
        component: Home,
        canActivate: [authGuard],
        children: [
            { path: 'inicio', loadComponent: () => import('./inicio/inicio').then((m) => m.Inicio) },
        ]
    },

    // ── Recursos Humanos — RRHH + ADMIN ─────────────────────────────
    {
        path: 'recursoshumanos',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ROLES_RRHH },
        children: [
            { path: 'inicio',      loadComponent: () => import('./rrhh/rrhh').then((m) => m.RecursosHumanos) },
            { path: 'empleados',   loadComponent: () => import('./empleado/empleado').then((m) => m.Empleado)        },
            { path: 'vacaciones',  loadComponent: () => import('./vacacion/vacacion').then((m) => m.Vacacion)        },
            { path: 'asistencias',  loadComponent: () => import('./asistencia/asistencia').then((m) => m.Asistencia)           },
            { path: 'prestaciones', loadComponent: () => import('./prestaciones/prestaciones').then((m) => m.PrestacionesComponent) },
            { path: 'prestamos',    loadComponent: () => import('./prestamos/prestamos').then((m) => m.PrestamosComponent)    },
        ]
    },

    // ── Seguridad — solo ADMIN ───────────────────────────────────────
    {
        path: 'seguridad',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ROLES_SEGURIDAD },
        children: [
            { path: 'inicio',     loadComponent: () => import('./seguridad/seguridad').then((m) => m.Seguridad)          },
            { path: 'usuarios',   loadComponent: () => import('./usuario/usuario').then((m) => m.Usuario)            },
            { path: 'roles',      loadComponent: () => import('./roles/roles').then((m) => m.Roles)              },
            { path: 'auditoria',  loadComponent: () => import('./auditoria/auditoria').then((m) => m.AuditoriaComponent) },
            { path: 'perfil',     loadComponent: () => import('./perfil/perfil').then((m) => m.PerfilComponent)    },
        ]
    },

    // ── Configuración — ADMIN + RRHH ─────────────────────────────────
    {
        path: 'configuracion',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ROLES_RRHH },
        children: [
            { path: 'inicio',         loadComponent: () => import('./configuracion/configuracion-inicio/configuracion-inicio').then((m) => m.ConfiguracionInicio)   },
            { path: 'departamentos',  loadComponent: () => import('./departamento/departamento').then((m) => m.DepartamentoComponent) },
            { path: 'puestos',        loadComponent: () => import('./puesto/puesto').then((m) => m.PuestoComponent)       },
            { path: 'jornadas',       loadComponent: () => import('./jornada-laboral/jornada-laboral').then((m) => m.JornadaLaboralComponent) },
            { path: 'bancos',         loadComponent: () => import('./banco/banco').then((m) => m.BancoComponent)        },
            { path: 'parametros',     loadComponent: () => import('./parametro-global/parametro-global').then((m) => m.ParametroGlobalComponent) },
            { path: 'estados-nomina',  loadComponent: () => import('./estado-nomina/estado-nomina').then((m) => m.EstadoNominaComponent) },
          { path: 'firmantes',       loadComponent: () => import('./config-firmante/config-firmante').then((m) => m.ConfigFirmanteComponent) },
          { path: 'empresa',         loadComponent: () => import('./config-empresa/config-empresa').then((m) => m.ConfigEmpresaComponent)  },
        ]
    },

    // ── Nómina — ADMIN + RRHH + GERENTE ─────────────────────────────
    {
        path: 'nomina',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ROLES_NOMINA },
        children: [
            { path: 'inicio',    loadComponent: () => import('./nomina/nomina-inicio/nomina-inicio').then((m) => m.NominaInicio)        },
            { path: 'nominas',   loadComponent: () => import('./nomina/nomina').then((m) => m.NominaComponent)     },
            { path: 'generar',   loadComponent: () => import('./nomina/nomina').then((m) => m.NominaComponent)     },
            { path: 'detalles',  loadComponent: () => import('./nomina/nomina-detalle/nomina-detalle').then((m) => m.NominaDetalleComponent) },
        ]
    },

    // ── Ventas — ADMIN + GERENTE ─────────────────────────────────────
    {
        path: 'ventas',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ROLES_VENTAS_FINANZAS },
        children: [
            { path: 'inicio',     loadComponent: () => import('./ventas/venta-inicio/venta-inicio').then((m) => m.VentaInicioComponent)      },
            { path: 'clientes',   loadComponent: () => import('./cliente/cliente').then((m) => m.ClienteComponent)          },
            { path: 'productos',  loadComponent: () => import('./producto-servicio/producto-servicio').then((m) => m.ProductoServicioComponent)  },
            { path: 'ventas',     loadComponent: () => import('./ventas/venta').then((m) => m.VentaComponent)            },
        ]
    },

    // ── Finanzas — ADMIN + GERENTE ───────────────────────────────────
    {
        path: 'finanzas',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ROLES_VENTAS_FINANZAS },
        children: [
            { path: 'inicio',       loadComponent: () => import('./finanzas/finanzas-inicio/finanzas-inicio').then((m) => m.FinanzasInicioComponent)      },
            { path: 'cuentas',      loadComponent: () => import('./finanzas/cuenta-bancaria/cuenta-bancaria').then((m) => m.CuentaBancariaComponent)      },
            { path: 'movimientos',  loadComponent: () => import('./finanzas/movimiento-financiero/movimiento-financiero').then((m) => m.MovimientoFinancieroComponent) },
        ]
    },

    // ── Reportería — todos los autenticados ──────────────────────────
    {
        path: 'reporteria',
        component: Home,
        canActivate: [authGuard],
        children: [
            { path: 'inicio',      loadComponent: () => import('./reporteria-inicio/reporteria-inicio').then((m) => m.ReporteriaInicio)           },
            { path: 'reportes',    loadComponent: () => import('./reporteria/reporteria').then((m) => m.Reporteria)                 },
            { path: 'historiales', loadComponent: () => import('./historiales/historiales').then((m) => m.HistorialesComponent)        },
            { path: 'ejecutivos',  loadComponent: () => import('./informes-ejecutivos/informes-ejecutivos').then((m) => m.InformesEjecutivosComponent) },
            { path: 'salarios',    loadComponent: () => import('./analisis-salarios/analisis-salarios').then((m) => m.AnalisisSalariosComponent)   },
            { path: '**',          loadComponent: () => import('./reporteria-inicio/reporteria-inicio').then((m) => m.ReporteriaInicio)           },
        ]
    },

    { path: '**', redirectTo: 'login' }
];
