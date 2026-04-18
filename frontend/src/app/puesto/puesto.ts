import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PuestoService } from '../services/puesto.service';
import { DepartamentoService } from '../services/departamento.service';
import { Puesto } from '../models/Puesto.model';
import { Departamento } from '../models/Departamento.model';

@Component({
  selector: 'app-puesto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './puesto.html',
  styleUrl: './puesto.css',
})
export class PuestoComponent implements OnInit {
  private puestoService = inject(PuestoService);
  private departamentoService = inject(DepartamentoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  puestos = signal<Puesto[]>([]);
  departamentos = signal<Departamento[]>([]);
  displayDialog = signal(false);
  isEditMode = signal(false);
  form = { NombrePuesto: '', IdDepartamento: 0 };
  selectedPuesto: Puesto | null = null;

  ngOnInit() {
    this.loadPuestos();
    this.loadDepartamentos();
  }

  loadPuestos() {
    this.puestoService.getAll().subscribe({
      next: (data) => this.puestos.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  loadDepartamentos() {
    this.departamentoService.getAll().subscribe({
      next: (data) => this.departamentos.set(data),
      error: () => {},
    });
  }

  getDepartamentoName(id: number): string {
    return this.departamentos().find((d) => d.IdDepartamento === id)?.NombreDepartamento || 'N/A';
  }

  showDialog() {
    this.isEditMode.set(false);
    this.form = { NombrePuesto: '', IdDepartamento: 0 };
    this.selectedPuesto = null;
    this.displayDialog.set(true);
  }

  editPuesto(puesto: Puesto) {
    this.isEditMode.set(true);
    this.form = { NombrePuesto: puesto.NombrePuesto, IdDepartamento: puesto.IdDepartamento };
    this.selectedPuesto = puesto;
    this.displayDialog.set(true);
  }

  savePuesto() {
    if (!this.form.NombrePuesto || !this.form.IdDepartamento) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa todos los campos' });
      return;
    }

    if (this.isEditMode() && this.selectedPuesto) {
      this.puestoService.update(this.selectedPuesto.IdPuesto, this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Puesto actualizado' });
          this.displayDialog.set(false);
          this.loadPuestos();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    } else {
      this.puestoService.create(this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Puesto creado' });
          this.displayDialog.set(false);
          this.loadPuestos();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    }
  }

  deletePuesto(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.puestoService.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Puesto eliminado' });
            this.loadPuestos();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }
}
