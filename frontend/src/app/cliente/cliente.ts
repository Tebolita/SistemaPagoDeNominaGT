import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { FieldsetModule } from 'primeng/fieldset';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ClienteService } from '../services/cliente.service';
import { Cliente } from '../models/Cliente.model';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
    SelectModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css'
})
export class ClienteComponent implements OnInit {
  clientes: Cliente[] = [];
  clienteForm: Partial<Cliente> = {};
  clienteDialog = false;
  isEdit = false;
  loading = false;

  tiposCliente = [
    { label: 'Individual', value: 'INDIVIDUAL' },
    { label: 'Empresa', value: 'EMPRESA' },
  ];

  private messageService = inject(MessageService);
  private clienteService = inject(ClienteService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadClientes();
  }

  loadClientes() {
    this.loading = true;
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.cdr.markForCheck();
      }
    });
  }

  openNew() {
    this.clienteForm = { Activo: true };
    this.isEdit = false;
    this.clienteDialog = true;
  }

  editCliente(cliente: Cliente) {
    this.clienteForm = { ...cliente };
    this.isEdit = true;
    this.clienteDialog = true;
  }

  saveCliente() {
    if (!this.clienteForm.NombreCliente) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre del cliente es obligatorio.' });
      return;
    }

    const operation = this.isEdit && this.clienteForm.IdCliente
      ? this.clienteService.update(this.clienteForm.IdCliente, this.clienteForm)
      : this.clienteService.create(this.clienteForm);

    operation.subscribe({
      next: () => {
        this.clienteDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Cliente ${this.isEdit ? 'actualizado' : 'creado'} correctamente.` });
        this.loadClientes();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  deleteCliente(cliente: Cliente) {
    if (!cliente.IdCliente) {
      return;
    }

    this.clienteService.delete(cliente.IdCliente).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cliente eliminado correctamente.' });
        this.loadClientes();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  hideDialog() {
    this.clienteDialog = false;
  }
}
