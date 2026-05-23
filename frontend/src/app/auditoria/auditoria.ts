import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { AuditoriaService } from '../services/auditoria.service';
import { AuditoriaSession, AuditoriaResumen } from '../models/Auditoria.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, TagModule, ToastModule,
    TooltipModule, InputTextModule, SelectModule, DatePickerModule,
  ],
  providers: [MessageService],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);
  private messageService   = inject(MessageService);

  registros  = signal<AuditoriaSession[]>([]);
  resumen    = signal<AuditoriaResumen | null>(null);
  loading    = signal(false);
  total      = signal(0);
  page       = signal(1);
  readonly limit = 50;

  // Filtros
  filtros = {
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
    accion:     '',
    username:   '',
    exitoso:    '',
  };

  accionOpciones = [
    { label: 'Todas', value: '' },
    { label: 'Login exitoso', value: 'LOGIN' },
    { label: 'Login fallido', value: 'LOGIN_FALLIDO' },
    { label: 'Logout', value: 'LOGOUT' },
  ];

  exitosoOpciones = [
    { label: 'Todos', value: '' },
    { label: 'Exitoso', value: 'true' },
    { label: 'Fallido', value: 'false' },
  ];

  ngOnInit() {
    this.cargar();
    this.cargarResumen();
  }

  cargar() {
    this.loading.set(true);
    this.auditoriaService.getAll({
      fechaDesde: this.filtros.fechaDesde?.toISOString().split('T')[0],
      fechaHasta: this.filtros.fechaHasta?.toISOString().split('T')[0],
      accion:     this.filtros.accion   || undefined,
      username:   this.filtros.username || undefined,
      exitoso:    this.filtros.exitoso  !== '' ? this.filtros.exitoso : undefined,
      page:       this.page(),
      limit:      this.limit,
    }).subscribe({
      next: (res) => {
        this.registros.set(res.registros);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loading.set(false);
      },
    });
  }

  cargarResumen() {
    this.auditoriaService.getResumen().subscribe({
      next: (r) => this.resumen.set(r),
      error: () => {},
    });
  }

  aplicarFiltros() {
    this.page.set(1);
    this.cargar();
  }

  limpiarFiltros() {
    this.filtros = { fechaDesde: null, fechaHasta: null, accion: '', username: '', exitoso: '' };
    this.page.set(1);
    this.cargar();
  }

  onPageChange(event: any) {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.cargar();
  }

  getSeverityAccion(accion: string): 'success' | 'danger' | 'secondary' | 'info' {
    if (accion === 'LOGIN')         return 'success';
    if (accion === 'LOGIN_FALLIDO') return 'danger';
    return 'secondary';
  }

  getIconAccion(accion: string): string {
    if (accion === 'LOGIN')         return 'pi pi-sign-in';
    if (accion === 'LOGIN_FALLIDO') return 'pi pi-times-circle';
    return 'pi pi-sign-out';
  }

  getLabelAccion(accion: string): string {
    if (accion === 'LOGIN')         return 'Login';
    if (accion === 'LOGIN_FALLIDO') return 'Fallido';
    return 'Logout';
  }

  formatUA(ua?: string): string {
    if (!ua) return '—';
    if (ua.includes('Chrome'))  return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari'))  return 'Safari';
    if (ua.includes('Edge'))    return 'Edge';
    return ua.substring(0, 30) + '…';
  }
}
