import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DepartamentoService } from '../services/departamento.service';
import { Departamento } from '../models/Departamento.model';

@Component({
  selector: 'app-departamento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    ProgressBarModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './departamento.html',
  styleUrl: './departamento.css',
})
export class DepartamentoComponent implements OnInit {
  private departamentoService = inject(DepartamentoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  departamentos = signal<Departamento[]>([]);
  displayDialog = signal(false);
  isEditMode = signal(false);
  form: { NombreDepartamento: string; Presupuesto: number | null } = { NombreDepartamento: '', Presupuesto: null };
  selectedDept: Departamento | null = null;

  ngOnInit() {
    this.loadDepartamentos();
  }

  loadDepartamentos() {
    this.departamentoService.getAll().subscribe({
      next: (data) => this.departamentos.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  showDialog() {
    this.isEditMode.set(false);
    this.form = { NombreDepartamento: '', Presupuesto: null };
    this.selectedDept = null;
    this.displayDialog.set(true);
  }

  editDepartamento(dept: Departamento) {
    this.isEditMode.set(true);
    this.form = { NombreDepartamento: dept.NombreDepartamento, Presupuesto: dept.Presupuesto ?? null };
    this.selectedDept = dept;
    this.displayDialog.set(true);
  }

  saveDepartamento() {
    if (!this.form.NombreDepartamento) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Ingresa el nombre' });
      return;
    }

    const payload: Partial<Departamento> = {
      NombreDepartamento: this.form.NombreDepartamento,
      ...(this.form.Presupuesto !== null ? { Presupuesto: this.form.Presupuesto } : {}),
    };

    if (this.isEditMode() && this.selectedDept) {
      this.departamentoService.update(this.selectedDept.IdDepartamento, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Departamento actualizado' });
          this.displayDialog.set(false);
          this.loadDepartamentos();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    } else {
      this.departamentoService.create(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Departamento creado' });
          this.displayDialog.set(false);
          this.loadDepartamentos();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    }
  }

  deleteDepartamento(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.departamentoService.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Departamento eliminado' });
            this.loadDepartamentos();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }

  getPorcentajeUso(dept: Departamento): number {
    if (!dept.Presupuesto || dept.Presupuesto === 0) return 0;
    return Math.min(100, Math.round(((dept.PresupuestoUsado ?? 0) / dept.Presupuesto) * 100));
  }

  getSeveridadPresupuesto(dept: Departamento): string {
    const pct = this.getPorcentajeUso(dept);
    if (pct >= 100) return 'danger';
    if (pct >= 80) return 'warn';
    return 'success';
  }
}
