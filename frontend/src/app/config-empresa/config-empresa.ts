import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ConfigEmpresaService, ConfigEmpresa } from '../services/config-empresa.service';

@Component({
  selector: 'app-config-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, ToastModule, DividerModule],
  providers: [MessageService],
  templateUrl: './config-empresa.html',
  styleUrl: './config-empresa.css',
})
export class ConfigEmpresaComponent implements OnInit {
  private svc = inject(ConfigEmpresaService);
  private messageService = inject(MessageService);

  saving  = signal(false);
  loading = signal(false);

  form: ConfigEmpresa = { NombreEmpresa: '', NIT: '', Direccion: '', Telefono: '', CorreoEmpresa: '', RegimenFiscal: 'GENERAL', Logo: '' };

  regimenes = [
    { label: 'Régimen General (ISR 25%)', value: 'GENERAL' },
    { label: 'Pequeño Contribuyente (5%)', value: 'PEQUENIO_CONTRIBUYENTE' },
  ];

  ngOnInit() {
    this.loading.set(true);
    this.svc.get().subscribe({
      next: (data) => {
        if (data) this.form = { ...data };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  guardar() {
    if (!this.form.NombreEmpresa || !this.form.NIT) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Nombre y NIT son obligatorios' });
      return;
    }
    this.saving.set(true);
    this.svc.upsert(this.form).subscribe({
      next: (data) => {
        this.form = { ...data };
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada correctamente' });
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.saving.set(false);
      },
    });
  }
}
