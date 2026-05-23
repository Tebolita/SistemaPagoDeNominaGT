import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfigFirmanteService } from '../services/config-firmante.service';
import { EmpleadoService } from '../services/empleado.service';
import { ConfigFirmanteNomina } from '../models/ConfigFirmante.model';
import { EmpleadoResponse } from '../models/Empleado.model';

const ROLES_DISPONIBLES = [
  'ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS HUMANOS',
];

@Component({
  selector: 'app-config-firmante',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, SelectModule, CheckboxModule, TagModule, ToastModule,
    ConfirmDialogModule, TooltipModule, ChipModule, TextareaModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './config-firmante.html',
  styleUrl: './config-firmante.css',
})
export class ConfigFirmanteComponent implements OnInit {
  private service             = inject(ConfigFirmanteService);
  private empleadoService     = inject(EmpleadoService);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  configs   = signal<ConfigFirmanteNomina[]>([]);
  empleados = signal<EmpleadoResponse[]>([]);
  loading   = false;
  dialog    = false;
  isEdit    = false;
  saving    = false;
  selected: ConfigFirmanteNomina | null = null;

  readonly rolesDisponibles = ROLES_DISPONIBLES;

  form: {
    TipoFirmante:        string;
    Descripcion:         string;
    rolesSeleccionados:  string[];
    IdEmpleadoRequerido: number | null;
    usarEmpleado:        boolean;
  } = this.emptyForm();

  ngOnInit() {
    this.load();
    this.empleadoService.ObtenerEmplados().subscribe({
      next: d => this.empleados.set(d),
      error: () => {},
    });
  }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: d => { this.configs.set(d); this.loading = false; },
      error: e => { this.loading = false; this.showError(e); },
    });
  }

  openNew() {
    this.form = this.emptyForm();
    this.selected = null;
    this.isEdit = false;
    this.dialog = true;
  }

  openEdit(c: ConfigFirmanteNomina) {
    this.selected = c;
    this.isEdit   = true;
    const roles   = c.RolesPermitidos ? c.RolesPermitidos.split(',').map(r => r.trim()) : [];
    this.form = {
      TipoFirmante:        c.TipoFirmante,
      Descripcion:         c.Descripcion ?? '',
      rolesSeleccionados:  roles,
      IdEmpleadoRequerido: c.IdEmpleadoRequerido ?? null,
      usarEmpleado:        !!c.IdEmpleadoRequerido,
    };
    this.dialog = true;
  }

  save() {
    if (!this.form.TipoFirmante.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre del tipo de firmante es obligatorio.' });
      return;
    }
    if (!this.form.usarEmpleado && this.form.rolesSeleccionados.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Debes seleccionar al menos un rol o un empleado específico.' });
      return;
    }

    this.saving = true;
    const payload: Partial<ConfigFirmanteNomina> = {
      TipoFirmante:        this.form.TipoFirmante.trim().toUpperCase().replace(/\s+/g, '_'),
      Descripcion:         this.form.Descripcion || undefined,
      RolesPermitidos:     this.form.usarEmpleado ? undefined : this.form.rolesSeleccionados.join(','),
      IdEmpleadoRequerido: this.form.usarEmpleado ? this.form.IdEmpleadoRequerido : null,
    };

    const obs = this.isEdit && this.selected
      ? this.service.update(this.selected.IdConfig, payload)
      : this.service.create(payload);

    obs.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Firmante ${this.isEdit ? 'actualizado' : 'creado'} correctamente.` });
        this.dialog = false;
        this.saving = false;
        this.load();
      },
      error: e => { this.saving = false; this.showError(e); },
    });
  }

  delete(c: ConfigFirmanteNomina) {
    this.confirmationService.confirm({
      message: `¿Eliminar el tipo de firmante <strong>${c.TipoFirmante}</strong>?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(c.IdConfig).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Tipo de firmante eliminado.' });
            this.load();
          },
          error: e => this.showError(e),
        });
      },
    });
  }

  toggleRol(rol: string) {
    const idx = this.form.rolesSeleccionados.indexOf(rol);
    if (idx >= 0) {
      this.form.rolesSeleccionados = this.form.rolesSeleccionados.filter(r => r !== rol);
    } else {
      this.form.rolesSeleccionados = [...this.form.rolesSeleccionados, rol];
    }
  }

  isRolSelected(rol: string): boolean {
    return this.form.rolesSeleccionados.includes(rol);
  }

  getRolesChips(config: ConfigFirmanteNomina): string[] {
    if (config.IdEmpleadoRequerido) return [];
    return config.RolesPermitidos ? config.RolesPermitidos.split(',').map(r => r.trim()) : [];
  }

  getEmpleadoNombre(id: number | null | undefined): string {
    if (!id) return '';
    const emp = this.empleados().find(e => e.IdEmpleado === id);
    return emp ? `${emp.Nombres} ${emp.Apellidos}` : `Empleado #${id}`;
  }

  private emptyForm() {
    return { TipoFirmante: '', Descripcion: '', rolesSeleccionados: [] as string[], IdEmpleadoRequerido: null as number | null, usarEmpleado: false };
  }

  private showError(e: any) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.message ?? 'Error inesperado' });
  }
}
