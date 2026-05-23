import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Home } from './home/home';
import { Empleado } from './empleado/empleado';
import { Vacacion } from './vacacion/vacacion';
import { Asistencia } from './asistencia/asistencia';
import { Inicio } from './inicio/inicio';
import { Usuario } from './usuario/usuario';
import { Seguridad } from './seguridad/seguridad';
import { RecursosHumanos } from './rrhh/rrhh';
import { Roles } from './roles/roles';
import { DepartamentoComponent } from './departamento/departamento';
import { PuestoComponent } from './puesto/puesto';
import { JornadaLaboralComponent } from './jornada-laboral/jornada-laboral';
import { BancoComponent } from './banco/banco';
import { ParametroGlobalComponent } from './parametro-global/parametro-global';
import { NominaComponent } from './nomina/nomina';
import { EstadoNominaComponent } from './estado-nomina/estado-nomina';
import { ConfigFirmanteComponent } from './config-firmante/config-firmante';
import { Reporteria } from './reporteria/reporteria';
import { ClienteComponent } from './cliente/cliente';
import { ProductoServicioComponent } from './producto-servicio/producto-servicio';
import { VentaInicioComponent } from './ventas/venta-inicio/venta-inicio';
import { VentaComponent } from './ventas/venta';
import { NominaInicio } from './nomina/nomina-inicio/nomina-inicio';
import { ReporteriaInicio } from './reporteria-inicio/reporteria-inicio';
import { ConfiguracionInicio } from './configuracion/configuracion-inicio/configuracion-inicio';
import { FinanzasInicioComponent } from './finanzas/finanzas-inicio/finanzas-inicio';
import { CuentaBancariaComponent } from './finanzas/cuenta-bancaria/cuenta-bancaria';
import { MovimientoFinancieroComponent } from './finanzas/movimiento-financiero/movimiento-financiero';
import { AuditoriaComponent } from './auditoria/auditoria';
import { HistorialesComponent } from './historiales/historiales';
import { InformesEjecutivosComponent } from './informes-ejecutivos/informes-ejecutivos';
import { AnalisisSalariosComponent } from './analisis-salarios/analisis-salarios';
import { NominaDetalleComponent } from './nomina/nomina-detalle/nomina-detalle';
import { PerfilComponent } from './perfil/perfil';
import { ConfigEmpresaComponent } from './config-empresa/config-empresa';
import { PrestacionesComponent } from './prestaciones/prestaciones';
import { PrestamosComponent } from './prestamos/prestamos';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';

// ── Roles reutilizables ──────────────────────────────────────────────
const ADMIN_ROLES      = ['ADMINISTRADOR', 'ADMIN'];
const RRHH_ROLES       = ['ADMINISTRADOR', 'ADMIN', 'RRHH', 'RECURSOS HUMANOS'];
const GERENTE_ROLES    = ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS HUMANOS'];
const FINANZAS_ROLES   = ['ADMINISTRADOR', 'ADMIN', 'GERENTE'];

export const routes: Routes = [
    { path: '', redirectTo: 'home/inicio', pathMatch: 'full' },
    { path: 'login', component: Login },

    {
        path: 'home',
        component: Home,
        canActivate: [authGuard],
        children: [
            { path: 'inicio', component: Inicio },
        ]
    },

    // ── Recursos Humanos — RRHH + ADMIN ─────────────────────────────
    {
        path: 'recursoshumanos',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: RRHH_ROLES },
        children: [
            { path: 'inicio',      component: RecursosHumanos },
            { path: 'empleados',   component: Empleado        },
            { path: 'vacaciones',  component: Vacacion        },
            { path: 'asistencias',  component: Asistencia           },
            { path: 'prestaciones', component: PrestacionesComponent },
            { path: 'prestamos',    component: PrestamosComponent    },
        ]
    },

    // ── Seguridad — solo ADMIN ───────────────────────────────────────
    {
        path: 'seguridad',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: ADMIN_ROLES },
        children: [
            { path: 'inicio',     component: Seguridad          },
            { path: 'usuarios',   component: Usuario            },
            { path: 'roles',      component: Roles              },
            { path: 'auditoria',  component: AuditoriaComponent },
            { path: 'perfil',     component: PerfilComponent    },
        ]
    },

    // ── Configuración — ADMIN + RRHH ─────────────────────────────────
    {
        path: 'configuracion',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: RRHH_ROLES },
        children: [
            { path: 'inicio',         component: ConfiguracionInicio   },
            { path: 'departamentos',  component: DepartamentoComponent },
            { path: 'puestos',        component: PuestoComponent       },
            { path: 'jornadas',       component: JornadaLaboralComponent },
            { path: 'bancos',         component: BancoComponent        },
            { path: 'parametros',     component: ParametroGlobalComponent },
            { path: 'estados-nomina',  component: EstadoNominaComponent },
          { path: 'firmantes',       component: ConfigFirmanteComponent },
          { path: 'empresa',         component: ConfigEmpresaComponent  },
        ]
    },

    // ── Nómina — ADMIN + RRHH + GERENTE ─────────────────────────────
    {
        path: 'nomina',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: GERENTE_ROLES },
        children: [
            { path: 'inicio',    component: NominaInicio        },
            { path: 'nominas',   component: NominaComponent     },
            { path: 'generar',   component: NominaComponent     },
            { path: 'detalles',  component: NominaDetalleComponent },
        ]
    },

    // ── Ventas — ADMIN + GERENTE ─────────────────────────────────────
    {
        path: 'ventas',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: FINANZAS_ROLES },
        children: [
            { path: 'inicio',     component: VentaInicioComponent      },
            { path: 'clientes',   component: ClienteComponent          },
            { path: 'productos',  component: ProductoServicioComponent  },
            { path: 'ventas',     component: VentaComponent            },
        ]
    },

    // ── Finanzas — ADMIN + GERENTE ───────────────────────────────────
    {
        path: 'finanzas',
        component: Home,
        canActivate: [authGuard, roleGuard],
        data: { roles: FINANZAS_ROLES },
        children: [
            { path: 'inicio',       component: FinanzasInicioComponent      },
            { path: 'cuentas',      component: CuentaBancariaComponent      },
            { path: 'movimientos',  component: MovimientoFinancieroComponent },
        ]
    },

    // ── Reportería — todos los autenticados ──────────────────────────
    {
        path: 'reporteria',
        component: Home,
        canActivate: [authGuard],
        children: [
            { path: 'inicio',      component: ReporteriaInicio           },
            { path: 'reportes',    component: Reporteria                 },
            { path: 'historiales', component: HistorialesComponent        },
            { path: 'ejecutivos',  component: InformesEjecutivosComponent },
            { path: 'salarios',    component: AnalisisSalariosComponent   },
            { path: '**',          component: ReporteriaInicio           },
        ]
    },

    { path: '**', redirectTo: 'login' }
];
