import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';

import { RolService } from '../services/rol.service';
import { RolInterface, Permiso, PermisosAgrupados } from '../models/Rol.model';

const MODULO_LABELS: Record<string, string> = {
  EMPLEADOS:         'Empleados',
  NOMINA:            'Nómina',
  DEPARTAMENTOS:     'Departamentos',
  CUENTAS_BANCARIAS: 'Cuentas Bancarias',
  MOVIMIENTOS:       'Movimientos Financieros',
  VENTAS:            'Ventas',
  PARAMETROS:        'Parámetros Globales',
  REPORTES:          'Reportería',
  CONFIGURACION:     'Configuración',
  USUARIOS:          'Usuarios',
};

const MODULO_ICONS: Record<string, string> = {
  EMPLEADOS:         'pi pi-users',
  NOMINA:            'pi pi-money-bill',
  DEPARTAMENTOS:     'pi pi-building',
  CUENTAS_BANCARIAS: 'pi pi-credit-card',
  MOVIMIENTOS:       'pi pi-arrows-h',
  VENTAS:            'pi pi-shopping-cart',
  PARAMETROS:        'pi pi-sliders-h',
  REPORTES:          'pi pi-chart-bar',
  CONFIGURACION:     'pi pi-cog',
  USUARIOS:          'pi pi-user',
};

const ACCION_ICONS: Record<string, string> = {
  VER:      'pi pi-eye',
  CREAR:    'pi pi-plus-circle',
  EDITAR:   'pi pi-pencil',
  ELIMINAR: 'pi pi-trash',
  FIRMAR:   'pi pi-check-circle',
};

const ACCION_COLORS: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
  VER:      { bg: 'rgba(56,189,248,0.15)',  border: '#38bdf8', text: '#7dd3fc', iconColor: '#38bdf8' },
  CREAR:    { bg: 'rgba(52,211,153,0.15)',  border: '#34d399', text: '#6ee7b7', iconColor: '#34d399' },
  EDITAR:   { bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24', text: '#fde68a', iconColor: '#fbbf24' },
  ELIMINAR: { bg: 'rgba(248,113,113,0.15)', border: '#f87171', text: '#fca5a5', iconColor: '#f87171' },
  FIRMAR:   { bg: 'rgba(167,139,250,0.15)', border: '#a78bfa', text: '#c4b5fd', iconColor: '#a78bfa' },
};

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    CheckboxModule,
    DividerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private rolService          = inject(RolService);

  roles              = signal<RolInterface[]>([]);
  catalogoPermisos   = signal<PermisosAgrupados>({});
  loading            = signal<boolean>(false);
  guardandoPermisos  = signal<boolean>(false);

  // Dialog crear/editar nombre
  mostrarDialog      = signal<boolean>(false);
  esEdicion          = signal<boolean>(false);
  form               = { IdRol: 0, NombreRol: '', Activo: true };

  // Dialog de permisos
  mostrarPermisos    = signal<boolean>(false);
  rolSeleccionado    = signal<RolInterface | null>(null);
  permisosSeleccionados = signal<Set<number>>(new Set());

  readonly MODULO_LABELS  = MODULO_LABELS;
  readonly MODULO_ICONS   = MODULO_ICONS;
  readonly ACCION_ICONS   = ACCION_ICONS;
  readonly ACCION_COLORS  = ACCION_COLORS;

  moduloActivo = signal<string>('');

  modulosOrdenados = computed(() =>
    Object.keys(this.catalogoPermisos()).sort((a, b) =>
      (MODULO_LABELS[a] ?? a).localeCompare(MODULO_LABELS[b] ?? b)
    )
  );

  permisosModuloActivo = computed(() =>
    this.catalogoPermisos()[this.moduloActivo()] ?? []
  );

  ngOnInit() {
    this.cargarRoles();
    this.cargarCatalogo();
  }

  cargarRoles() {
    this.loading.set(true);
    this.rolService.getRoles().subscribe({
      next: (data) => { this.roles.set(data); this.loading.set(false); },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loading.set(false);
      },
    });
  }

  cargarCatalogo() {
    this.rolService.getCatalogoPermisos().subscribe({
      next: (data) => this.catalogoPermisos.set(data),
      error: () => {},
    });
  }

  // ── CRUD rol ─────────────────────────────────────────────────────
  abrirNuevo() {
    this.form = { IdRol: 0, NombreRol: '', Activo: true };
    this.esEdicion.set(false);
    this.mostrarDialog.set(true);
  }

  editarRol(rol: RolInterface) {
    this.form = { IdRol: rol.IdRol ?? 0, NombreRol: rol.NombreRol, Activo: rol.Activo ?? true };
    this.esEdicion.set(true);
    this.mostrarDialog.set(true);
  }

  guardarRol() {
    if (!this.form.NombreRol.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre del rol es requerido' });
      return;
    }

    const payload = { NombreRol: this.form.NombreRol.trim().toUpperCase() };
    const obs = this.esEdicion()
      ? this.rolService.updateRol(this.form.IdRol, payload)
      : this.rolService.createRol(payload as RolInterface);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.esEdicion() ? 'Actualizado' : 'Creado',
          detail: `Rol ${this.esEdicion() ? 'actualizado' : 'creado'} correctamente`,
        });
        this.mostrarDialog.set(false);
        this.cargarRoles();
      },
      error: (err) =>
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  eliminarRol(rol: RolInterface) {
    if (!rol.IdRol) return;
    this.confirmationService.confirm({
      message: `¿Cambiar estado del rol <b>${rol.NombreRol}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.rolService.deleteRol(rol.IdRol!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Estado del rol actualizado' });
            this.cargarRoles();
          },
          error: (err) =>
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }

  // ── Gestión de permisos ──────────────────────────────────────────
  abrirPermisos(rol: RolInterface) {
    this.rolSeleccionado.set(rol);
    const ids = new Set<number>((rol.Permisos ?? []).map((p) => p.IdPermiso));
    this.permisosSeleccionados.set(ids);
    // Activar el primer módulo disponible
    const primero = this.modulosOrdenados()[0] ?? '';
    this.moduloActivo.set(primero);
    this.mostrarPermisos.set(true);
  }

  tienePermiso(idPermiso: number): boolean {
    return this.permisosSeleccionados().has(idPermiso);
  }

  togglePermiso(idPermiso: number) {
    const set = new Set(this.permisosSeleccionados());
    if (set.has(idPermiso)) set.delete(idPermiso);
    else set.add(idPermiso);
    this.permisosSeleccionados.set(set);
  }

  toggleModulo(modulo: string, seleccionar: boolean) {
    const set = new Set(this.permisosSeleccionados());
    for (const p of (this.catalogoPermisos()[modulo])) {
      if (seleccionar) set.add(p.IdPermiso);
      else set.delete(p.IdPermiso);
    }
    this.permisosSeleccionados.set(set);
  }

  moduloCompleto(modulo: string): boolean {
    const permisos = this.catalogoPermisos()[modulo];
    return permisos.length > 0 && permisos.every((p) => this.permisosSeleccionados().has(p.IdPermiso));
  }

  guardarPermisos() {
    const rol = this.rolSeleccionado();
    if (!rol?.IdRol) return;

    this.guardandoPermisos.set(true);
    const idPermisos = Array.from(this.permisosSeleccionados());

    this.rolService.asignarPermisos(rol.IdRol, idPermisos).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Permisos actualizados correctamente' });
        this.mostrarPermisos.set(false);
        this.guardandoPermisos.set(false);
        this.cargarRoles();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.guardandoPermisos.set(false);
      },
    });
  }

  // ── Helpers de vista ─────────────────────────────────────────────
  getModulosRol(rol: RolInterface): string[] {
    const modulos = [...new Set((rol.Permisos ?? []).map((p) => p.Modulo))];
    return modulos.sort((a, b) => (MODULO_LABELS[a] ?? a).localeCompare(MODULO_LABELS[b] ?? b));
  }

  getIconAccion(accion: string): string {
    return ACCION_ICONS[accion] ?? 'pi pi-circle';
  }

  getIconModulo(modulo: string): string {
    return MODULO_ICONS[modulo] ?? 'pi pi-circle';
  }

  getNombreModulo(modulo: string): string {
    return MODULO_LABELS[modulo] ?? modulo;
  }

  getColorAccion(accion: string) {
    return ACCION_COLORS[accion] ?? { bg: 'rgba(100,116,139,0.15)', border: '#64748b', text: '#94a3b8', iconColor: '#64748b' };
  }

  getCountModulo(modulo: string): { sel: number; total: number } {
    const permisos = this.catalogoPermisos()[modulo] ?? [];
    const sel = permisos.filter((p) => this.permisosSeleccionados().has(p.IdPermiso)).length;
    return { sel, total: permisos.length };
  }

  getEstadoModulo(modulo: string): 'completo' | 'parcial' | 'vacio' {
    const { sel, total } = this.getCountModulo(modulo);
    if (sel === 0) return 'vacio';
    if (sel === total) return 'completo';
    return 'parcial';
  }
}
