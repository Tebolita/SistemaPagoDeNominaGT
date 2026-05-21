import { Component, OnInit, signal, inject } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';

import { RolService } from '../services/rol.service';
import { RolInterface } from '../models/Rol.model';

// Mapa de permisos por rol para mostrar visualmente qué puede hacer cada uno
const ROL_PERMISOS: Record<string, { modulos: string[]; color: string; icon: string }> = {
  ADMINISTRADOR: {
    color: 'danger',
    icon: 'pi pi-shield',
    modulos: ['Seguridad', 'Usuarios', 'RRHH', 'Nómina', 'Finanzas', 'Ventas', 'Reportería', 'Configuración'],
  },
  ADMIN: {
    color: 'danger',
    icon: 'pi pi-shield',
    modulos: ['Seguridad', 'Usuarios', 'RRHH', 'Nómina', 'Finanzas', 'Ventas', 'Reportería', 'Configuración'],
  },
  GERENTE: {
    color: 'warn',
    icon: 'pi pi-briefcase',
    modulos: ['Nómina', 'Finanzas', 'Ventas', 'Reportería'],
  },
  RRHH: {
    color: 'info',
    icon: 'pi pi-users',
    modulos: ['RRHH', 'Nómina', 'Reportería', 'Configuración'],
  },
  'RECURSOS HUMANOS': {
    color: 'info',
    icon: 'pi pi-users',
    modulos: ['RRHH', 'Nómina', 'Reportería', 'Configuración'],
  },
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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  private messageService    = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private rolService        = inject(RolService);

  roles   = signal<RolInterface[]>([]);
  loading = signal<boolean>(false);

  mostrarDialog = signal<boolean>(false);
  esEdicion     = signal<boolean>(false);

  // Formulario como plain object (evita el bug del signal binding)
  form = { IdRol: 0, NombreRol: '', Activo: true };

  readonly ROL_PERMISOS = ROL_PERMISOS;

  ngOnInit() {
    this.cargarRoles();
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

  getPermisosRol(nombre: string) {
    const key = Object.keys(ROL_PERMISOS).find(k => k === nombre.toUpperCase().trim());
    return key ? ROL_PERMISOS[key] : null;
  }

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

    const payload = { NombreRol: this.form.NombreRol.trim() };

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
      message: `¿Eliminar el rol <b>${rol.NombreRol}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.rolService.deleteRol(rol.IdRol!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado' });
            this.cargarRoles();
          },
          error: (err) =>
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }
}
