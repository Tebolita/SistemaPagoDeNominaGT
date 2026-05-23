import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PrestamoService, Prestamo, Cuota } from '../services/prestamo.service';
import { EmpleadoService } from '../services/empleado.service';
import { EmpleadoResponse } from '../models/Empleado.model';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, SelectModule, DatePickerModule,
    InputTextModule, InputNumberModule, TagModule, ToastModule,
    TooltipModule, ConfirmDialogModule, DialogModule, ProgressBarModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './prestamos.html',
  styleUrl: './prestamos.css',
})
export class PrestamosComponent implements OnInit {
  private svc             = inject(PrestamoService);
  private empleadoService = inject(EmpleadoService);
  private messageService  = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  prestamos  = signal<Prestamo[]>([]);
  empleados  = signal<EmpleadoResponse[]>([]);
  loading    = signal(false);
  guardando  = signal(false);

  mostrarForm      = signal(false);
  mostrarCuotas    = signal(false);
  prestamoActual   = signal<Prestamo | null>(null);

  filtroEmpleado = signal<number | null>(null);

  form = {
    idEmpleado:      null as number | null,
    montoPrestamo:   null as number | null,
    totalCuotas:     12,
    fechaAprobacion: null as Date | null,
    descripcion:     '',
  };

  cuotasOpciones = [3, 6, 9, 12, 18, 24].map(n => ({ label: `${n} cuotas`, value: n }));

  get cuotaEstimada(): number {
    if (!this.form.montoPrestamo || !this.form.totalCuotas) return 0;
    return parseFloat((this.form.montoPrestamo / this.form.totalCuotas).toFixed(2));
  }

  get porcentajePagado(): number {
    const p = this.prestamoActual();
    if (!p || !p.TotalCuotas) return 0;
    return Math.round((p.CuotasPagadas / p.TotalCuotas) * 100);
  }

  ngOnInit() {
    this.empleadoService.ObtenerEmplados().subscribe({
      next: (d) => this.empleados.set(d.filter(e => e.Activo !== false)),
      error: () => {},
    });
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.svc.getAll(this.filtroEmpleado() ?? undefined).subscribe({
      next: (d) => { this.prestamos.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirForm() {
    this.form = { idEmpleado: null, montoPrestamo: null, totalCuotas: 12, fechaAprobacion: new Date(), descripcion: '' };
    this.mostrarForm.set(true);
  }

  guardar() {
    if (!this.form.idEmpleado || !this.form.montoPrestamo || !this.form.fechaAprobacion) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa todos los campos requeridos' });
      return;
    }
    this.guardando.set(true);
    this.svc.create({
      idEmpleado:      this.form.idEmpleado,
      montoPrestamo:   this.form.montoPrestamo,
      totalCuotas:     this.form.totalCuotas,
      fechaAprobacion: this.form.fechaAprobacion.toISOString().split('T')[0],
      descripcion:     this.form.descripcion || undefined,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Préstamo registrado y cuotas generadas' });
        this.mostrarForm.set(false);
        this.cargar();
        this.guardando.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.guardando.set(false);
      },
    });
  }

  verCuotas(p: Prestamo) {
    this.prestamoActual.set(p);
    this.mostrarCuotas.set(true);
  }

  pagarCuota(cuota: Cuota) {
    this.confirmationService.confirm({
      message: `¿Marcar cuota #${cuota.NumeroCuota} como pagada (Q ${cuota.MontoCuota.toFixed(2)})?`,
      header: 'Confirmar pago',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.svc.pagarCuota(cuota.IdCuota).subscribe({
          next: (updated) => {
            this.prestamoActual.set(updated);
            this.messageService.add({ severity: 'success', summary: 'Pagado', detail: `Cuota #${cuota.NumeroCuota} registrada` });
            this.cargar();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }

  cancelarPrestamo(p: Prestamo) {
    this.confirmationService.confirm({
      message: `¿Cancelar el préstamo de ${p.Empleado?.Nombres}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.cancelar(p.IdPrestamo).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Cancelado', detail: 'Préstamo cancelado' }); this.cargar(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }

  getSeveridadEstado(estado: string): 'success' | 'danger' | 'warn' | 'secondary' {
    if (estado === 'ACTIVO')    return 'warn';
    if (estado === 'PAGADO')    return 'success';
    if (estado === 'CANCELADO') return 'danger';
    return 'secondary';
  }
}
