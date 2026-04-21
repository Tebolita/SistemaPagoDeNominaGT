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
import { JornadaLaboralService } from '../services/jornada-laboral.service';
import { JornadaLaboral } from '../models/JornadaLaboral.model';

@Component({
  selector: 'app-jornada-laboral',
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
  templateUrl: './jornada-laboral.html',
  styleUrl: './jornada-laboral.css',
})
export class JornadaLaboralComponent implements OnInit {
  private jornadaService = inject(JornadaLaboralService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  jornadas = signal<JornadaLaboral[]>([]);
  displayDialog = signal(false);
  isEditMode = signal(false);
  form = { NombreJornada: '', HorasDiarias: 8, HorasSemanales: 40 };
  selectedJornada: JornadaLaboral | null = null;

  ngOnInit() {
    this.loadJornadas();
  }

  loadJornadas() {
    this.jornadaService.getAll().subscribe({
      next: (data) => this.jornadas.set(data),
      error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  showDialog() {
    this.isEditMode.set(false);
    this.form = { NombreJornada: '', HorasDiarias: 8, HorasSemanales: 40 };
    this.selectedJornada = null;
    this.displayDialog.set(true);
  }

  editJornada(jornada: JornadaLaboral) {
    this.isEditMode.set(true);
    this.form = {
      NombreJornada: jornada.NombreJornada,
      HorasDiarias: jornada.HorasDiarias,
      HorasSemanales: jornada.HorasSemanales
    };
    this.selectedJornada = jornada;
    this.displayDialog.set(true);
  }

  saveJornada() {
    console.log('Form values:', this.form);
    console.log('HorasDiarias type:', typeof this.form.HorasDiarias, 'value:', this.form.HorasDiarias);
    console.log('HorasSemanales type:', typeof this.form.HorasSemanales, 'value:', this.form.HorasSemanales);

    // Ensure numeric values are valid
    const horasDiarias = Number(this.form.HorasDiarias);
    const horasSemanales = Number(this.form.HorasSemanales);

    if (!this.form.NombreJornada || isNaN(horasDiarias) || isNaN(horasSemanales) || horasDiarias < 1 || horasDiarias > 24 || horasSemanales < 1 || horasSemanales > 168) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa todos los campos con valores válidos' });
      return;
    }

    const formData = {
      NombreJornada: this.form.NombreJornada,
      HorasDiarias: horasDiarias,
      HorasSemanales: horasSemanales
    };

    if (this.isEditMode() && this.selectedJornada) {
      this.jornadaService.update(this.selectedJornada.IdJornada, formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Jornada actualizada' });
          this.displayDialog.set(false);
          this.loadJornadas();
        },
        error: (err) => {
          console.error('Update error:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        },
      });
    } else {
      this.jornadaService.create(formData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Jornada creada' });
          this.displayDialog.set(false);
          this.loadJornadas();
        },
        error: (err) => {
          console.error('Create error:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        },
      });
    }
  }

  deleteJornada(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.jornadaService.delete(id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Jornada eliminada' });
            this.loadJornadas();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }
}
