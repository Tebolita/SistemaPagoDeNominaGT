import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { BancoService } from '../services/banco.service';
import { Banco } from '../models/Banco.model';

@Component({
  selector: 'app-banco',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './banco.html',
  styleUrl: './banco.css',
})
export class BancoComponent implements OnInit {
  private bancoService = inject(BancoService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  bancos = signal<Banco[]>([]);
  displayDialog = signal(false);
  isEditMode = signal(false);
  form = { NombreBanco: '' };
  selectedBanco: Banco | null = null;

  ngOnInit() {
    this.loadBancos();
  }

  loadBancos() {
    this.bancoService.getAll().subscribe({
      next: (data) => this.bancos.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  showDialog() {
    this.isEditMode.set(false);
    this.form = { NombreBanco: '' };
    this.selectedBanco = null;
    this.displayDialog.set(true);
  }

  editBanco(banco: Banco) {
    this.isEditMode.set(true);
    this.form = { NombreBanco: banco.NombreBanco };
    this.selectedBanco = banco;
    this.displayDialog.set(true);
  }

  saveBanco() {
    if (!this.form.NombreBanco) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Ingresa el nombre' });
      return;
    }

    if (this.isEditMode() && this.selectedBanco) {
      this.bancoService.update(this.selectedBanco.IdBanco, this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Banco actualizado' });
          this.displayDialog.set(false);
          this.loadBancos();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    } else {
      this.bancoService.create(this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Banco creado' });
          this.displayDialog.set(false);
          this.loadBancos();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
      });
    }
  }

  deleteBanco(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.bancoService.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Banco eliminado' });
            this.loadBancos();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }
}
