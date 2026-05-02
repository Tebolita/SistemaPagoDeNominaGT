import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EstadoNominaService } from '../services/estado-nomina.service';
import { EstadoNomina } from '../models/EstadoNomina.model';

@Component({
  selector: 'app-estado-nomina',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './estado-nomina.html',
  styleUrl: './estado-nomina.css',
})
export class EstadoNominaComponent implements OnInit {
  private estadoNominaService = inject(EstadoNominaService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  estados = signal<EstadoNomina[]>([]);
  displayDialog = signal(false);
  editingEstado: EstadoNomina | null = null;

  form = {
    NombreEstado: '',
    Descripcion: '',
    Orden: 0,
    RequiereAprobacion: false,
    Activo: true,
  };

  ngOnInit() {
    this.loadEstados();
  }

  private handleError(error: any, defaultMessage: string = 'Ha ocurrido un error inesperado'): string {
    console.error('Error en estados de nómina:', error);

    if (error?.message) {
      return error.message;
    }

    return defaultMessage;
  }

  loadEstados() {
    this.estadoNominaService.getAll().subscribe({
      next: (data) => this.estados.set(data),
      error: (err) => {
        const errorMessage = this.handleError(err, 'No se pudieron cargar los estados de nómina');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar estados',
          detail: errorMessage,
        });
      },
    });
  }

  showDialog(estado?: EstadoNomina) {
    this.displayDialog.set(true);

    if (estado) {
      this.editingEstado = estado;
      this.form = {
        NombreEstado: estado.NombreEstado,
        Descripcion: estado.Descripcion || '',
        Orden: estado.Orden,
        RequiereAprobacion: estado.RequiereAprobacion || false,
        Activo: estado.Activo || true,
      };
    } else {
      this.editingEstado = null;
      this.form = {
        NombreEstado: '',
        Descripcion: '',
        Orden: 0,
        RequiereAprobacion: false,
        Activo: true,
      };
    }
  }

  hideDialog() {
    this.displayDialog.set(false);
    this.editingEstado = null;
  }

  saveEstado() {
    if (!this.form.NombreEstado.trim() || this.form.Orden <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Completa todos los campos obligatorios',
      });
      return;
    }

    const estadoData = { ...this.form };

    if (this.editingEstado) {
      // Actualizar
      this.estadoNominaService.update(this.editingEstado.IdEstadoNomina, estadoData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Estado de nómina actualizado exitosamente',
          });
          this.hideDialog();
          this.loadEstados();
        },
        error: (err) => {
          const errorMessage = this.handleError(err, 'No se pudo actualizar el estado de nómina');
          this.messageService.add({
            severity: 'error',
            summary: 'Error al actualizar',
            detail: errorMessage,
          });
        },
      });
    } else {
      // Crear
      this.estadoNominaService.create(estadoData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Estado de nómina creado exitosamente',
          });
          this.hideDialog();
          this.loadEstados();
        },
        error: (err) => {
          const errorMessage = this.handleError(err, 'No se pudo crear el estado de nómina');
          this.messageService.add({
            severity: 'error',
            summary: 'Error al crear',
            detail: errorMessage,
          });
        },
      });
    }
  }

  deleteEstado(estado: EstadoNomina) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el estado "${estado.NombreEstado}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.estadoNominaService.delete(estado.IdEstadoNomina).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Estado de nómina eliminado exitosamente',
            });
            this.loadEstados();
          },
          error: (err) => {
            const errorMessage = this.handleError(err, 'No se pudo eliminar el estado de nómina');
            this.messageService.add({
              severity: 'error',
              summary: 'Error al eliminar',
              detail: errorMessage,
            });
          },
        });
      },
    });
  }

  getEstadoSeverity(activo: boolean | undefined): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }

  getEstadoLabel(activo: boolean | undefined): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}
