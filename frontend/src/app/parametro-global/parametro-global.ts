import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ParametroGlobalService } from '../services/parametro-global.service';
import { ParametroGlobal } from '../models/ParametroGlobal.model';

@Component({
  selector: 'app-parametro-global',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './parametro-global.html',
  styleUrl: './parametro-global.css',
})
export class ParametroGlobalComponent implements OnInit {
  private parametroService = inject(ParametroGlobalService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  parametros = signal<ParametroGlobal[]>([]);
  displayDialog = signal(false);
  isEditMode = signal(false);
  form: { NombreParametro: string; Valor: number; Descripcion?: string } = { NombreParametro: '', Valor: 0, Descripcion: '' };
  selectedParametro: ParametroGlobal | null = null;

  ngOnInit() {
    this.loadParametros();
  }

  loadParametros() {
    this.parametroService.getAll().subscribe({
      next: (data) => this.parametros.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  showDialog() {
    this.isEditMode.set(false);
    this.form = { NombreParametro: '', Valor: 0 };
    this.selectedParametro = null;
    this.displayDialog.set(true);
  }

  editParametro(param: ParametroGlobal) {
    this.isEditMode.set(true);
    this.form = { ...param };
    this.selectedParametro = param;
    this.displayDialog.set(true);
  }

  saveParametro() {
    if (!this.form.NombreParametro || this.form.Valor === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa los campos obligatorios' });
      return;
    }

    if (this.isEditMode() && this.selectedParametro) {
      this.parametroService.update(this.selectedParametro.IdParametro, this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Parámetro actualizado' });
          this.displayDialog.set(false);
          this.loadParametros();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    } else {
      this.parametroService.create(this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Parámetro creado' });
          this.displayDialog.set(false);
          this.loadParametros();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    }
  }

  deleteParametro(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.parametroService.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Parámetro eliminado' });
            this.loadParametros();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }
}
