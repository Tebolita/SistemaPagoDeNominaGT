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
import { MessageService, ConfirmationService } from 'primeng/api';
import { LiquidacionService, LiquidacionCalculo, Liquidacion } from '../services/liquidacion.service';
import { EmpleadoService } from '../services/empleado.service';
import { EmpleadoResponse } from '../models/Empleado.model';

@Component({
  selector: 'app-prestaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, SelectModule, DatePickerModule,
    InputTextModule, InputNumberModule, TagModule, ToastModule, TooltipModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './prestaciones.html',
  styleUrl: './prestaciones.css',
})
export class PrestacionesComponent implements OnInit {
  private svc            = inject(LiquidacionService);
  private empleadoService = inject(EmpleadoService);
  private messageService  = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  empleados  = signal<EmpleadoResponse[]>([]);
  historial  = signal<Liquidacion[]>([]);
  calculo    = signal<LiquidacionCalculo | null>(null);
  calculando = signal(false);
  guardando  = signal(false);
  loading    = signal(false);

  form = {
    idEmpleado:              null as number | null,
    fechaLiquidacion:        null as Date | null,
    motivoSalida:            '',
    diasVacacionesPendientes: 0,
    observaciones:           '',
  };

  readonly Math = Math;

  motivosSalida = [
    { label: 'Renuncia voluntaria', value: 'Renuncia voluntaria' },
    { label: 'Despido justificado', value: 'Despido justificado' },
    { label: 'Despido injustificado', value: 'Despido injustificado' },
    { label: 'Mutuo acuerdo', value: 'Mutuo acuerdo' },
    { label: 'Jubilación', value: 'Jubilación' },
    { label: 'Fin de contrato', value: 'Fin de contrato' },
  ];

  ngOnInit() {
    this.empleadoService.ObtenerEmplados().subscribe({
      next: (d) => this.empleados.set(d.filter(e => e.Activo !== false)),
      error: () => {},
    });
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (d) => { this.historial.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  calcular() {
    if (!this.form.idEmpleado || !this.form.fechaLiquidacion) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona empleado y fecha' });
      return;
    }
    this.calculando.set(true);
    this.calculo.set(null);
    this.svc.calcular({
      idEmpleado:              this.form.idEmpleado,
      fechaLiquidacion:        this.form.fechaLiquidacion.toISOString().split('T')[0],
      motivoSalida:            this.form.motivoSalida || undefined,
      diasVacacionesPendientes: this.form.diasVacacionesPendientes,
      observaciones:           this.form.observaciones || undefined,
    }).subscribe({
      next: (d) => { this.calculo.set(d); this.calculando.set(false); },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.calculando.set(false);
      },
    });
  }

  guardar() {
    if (!this.calculo()) return;
    this.guardando.set(true);
    this.svc.crear({
      idEmpleado:              this.form.idEmpleado,
      fechaLiquidacion:        this.form.fechaLiquidacion!.toISOString().split('T')[0],
      motivoSalida:            this.form.motivoSalida || undefined,
      diasVacacionesPendientes: this.form.diasVacacionesPendientes,
      observaciones:           this.form.observaciones || undefined,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Liquidación registrada' });
        this.calculo.set(null);
        this.form = { idEmpleado: null, fechaLiquidacion: null, motivoSalida: '', diasVacacionesPendientes: 0, observaciones: '' };
        this.cargarHistorial();
        this.guardando.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.guardando.set(false);
      },
    });
  }

  marcarPagada(liq: Liquidacion) {
    this.confirmationService.confirm({
      message: `¿Marcar como PAGADA la liquidación de ${liq.Empleado?.Nombres}?`,
      header: 'Confirmar',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.svc.pagar(liq.IdLiquidacion).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Liquidación marcada como pagada' }); this.cargarHistorial(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }

  eliminar(liq: Liquidacion) {
    this.confirmationService.confirm({
      message: `¿Eliminar la liquidación de ${liq.Empleado?.Nombres}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.svc.eliminar(liq.IdLiquidacion).subscribe({
          next: () => { this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Liquidación eliminada' }); this.cargarHistorial(); },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }

  getEmpleadoNombre(id: number | null): string {
    if (!id) return '—';
    const e = this.empleados().find(x => x.IdEmpleado === id);
    return e ? `${e.Nombres} ${e.Apellidos}` : `#${id}`;
  }
}
