import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { ReporteriaService } from '../services/reporteria.service';

@Component({
  selector: 'app-reporteria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    SelectModule,
    DatePickerModule,
    TagModule,
    ChartModule,
  ],
  providers: [MessageService],
  templateUrl: './reporteria.html',
  styleUrl: './reporteria.css'
})
export class Reporteria implements OnInit {
  // Opciones de reportes
  reportes = [
    { label: 'Resumen Ejecutivo', value: 'resumen' },
    { label: 'Empleados', value: 'empleados' },
    { label: 'Salarios', value: 'salarios' },
    { label: 'Departamentos', value: 'departamentos' },
    { label: 'Nómina', value: 'nomina' },
    { label: 'Asistencias', value: 'asistencias' },
    { label: 'Vacaciones', value: 'vacaciones' },
  ];

  selectedReporte = signal<string>('resumen');
  loading = signal<boolean>(false);

  // Datos de reportes
  resumen = signal<any>(null);
  empleados = signal<any[]>([]);
  salarios = signal<any[]>([]);
  departamentos = signal<any[]>([]);
  nominas = signal<any[]>([]);
  asistencias = signal<any[]>([]);
  vacaciones = signal<any[]>([]);

  // Filtros
  fechaInicio = signal<Date | null>(null);
  fechaFin = signal<Date | null>(null);
  mes = signal<number | null>(null);
  anio = signal<number | null>(null);
  anioVacaciones = signal<number | null>(null);

  // Opciones para dropdowns
  meses = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 },
  ];

  anios: { label: string; value: number }[] = [];
  anioActual = new Date().getFullYear();

  constructor(
    private reporteriaService: ReporteriaService,
    private messageService: MessageService
  ) {
    // Generar años para los dropdowns
    for (let i = this.anioActual; i >= this.anioActual - 5; i--) {
      this.anios.push({ label: i.toString(), value: i });
    }
  }

  ngOnInit() {
    this.loadReporte();
  }

  onReporteChange() {
    this.loadReporte();
  }

  loadReporte() {
    const reporte = this.selectedReporte();
    this.loading.set(true);

    switch (reporte) {
      case 'resumen':
        this.loadResumen();
        break;
      case 'empleados':
        this.loadEmpleados();
        break;
      case 'salarios':
        this.loadSalarios();
        break;
      case 'departamentos':
        this.loadDepartamentos();
        break;
      case 'nomina':
        this.loadNomina();
        break;
      case 'asistencias':
        this.loadAsistencias();
        break;
      case 'vacaciones':
        this.loadVacaciones();
        break;
    }
  }

  loadResumen() {
    this.reporteriaService.getResumenEjecutivo().subscribe({
      next: (data) => {
        this.resumen.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar resumen' });
        this.loading.set(false);
      }
    });
  }

  loadEmpleados() {
    const fi = this.fechaInicio() ? this.fechaInicio()!.toISOString().split('T')[0] : undefined;
    const ff = this.fechaFin() ? this.fechaFin()!.toISOString().split('T')[0] : undefined;
    
    this.reporteriaService.getReporteEmpleados(fi, ff).subscribe({
      next: (data) => {
        this.empleados.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar empleados' });
        this.loading.set(false);
      }
    });
  }

  loadSalarios() {
    this.reporteriaService.getReporteSalarios().subscribe({
      next: (data) => {
        this.salarios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar salarios' });
        this.loading.set(false);
      }
    });
  }

  loadDepartamentos() {
    this.reporteriaService.getReporteDepartamentos().subscribe({
      next: (data) => {
        this.departamentos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar departamentos' });
        this.loading.set(false);
      }
    });
  }

  loadNomina() {
    this.reporteriaService.getReporteNomina(this.mes() || undefined, this.anio() || undefined).subscribe({
      next: (data) => {
        this.nominas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar nómina' });
        this.loading.set(false);
      }
    });
  }

  loadAsistencias() {
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione rango de fechas' });
      this.loading.set(false);
      return;
    }

    const fi = this.fechaInicio()!.toISOString().split('T')[0];
    const ff = this.fechaFin()!.toISOString().split('T')[0];

    this.reporteriaService.getReporteAsistencias(fi, ff).subscribe({
      next: (data) => {
        this.asistencias.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar asistencias' });
        this.loading.set(false);
      }
    });
  }

  loadVacaciones() {
    this.reporteriaService.getReporteVacaciones(this.anioVacaciones() || undefined).subscribe({
      next: (data) => {
        this.vacaciones.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar vacaciones' });
        this.loading.set(false);
      }
    });
  }

  // ========== MÉTODOS DE EXPORTACIÓN ==========

  exportToExcel() {
    const reporte = this.selectedReporte();
    let url = `${this.reporteriaService.apiUrl}/${reporte}/export/excel`;

    // Agregar parámetros según el reporte
    switch (reporte) {
      case 'empleados':
        const fi = this.fechaInicio() ? this.fechaInicio()!.toISOString().split('T')[0] : '';
        const ff = this.fechaFin() ? this.fechaFin()!.toISOString().split('T')[0] : '';
        if (fi) url += `?fechaInicio=${fi}`;
        if (ff) url += `${fi ? '&' : '?'}fechaFin=${ff}`;
        break;
      case 'nomina':
        if (this.mes()) url += `?mes=${this.mes()}`;
        if (this.anio()) url += `${this.mes() ? '&' : '?'}anio=${this.anio()}`;
        break;
      case 'asistencias':
        const fechaInicio = this.fechaInicio()!.toISOString().split('T')[0];
        const fechaFin = this.fechaFin()!.toISOString().split('T')[0];
        url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
        break;
      case 'vacaciones':
        if (this.anioVacaciones()) url += `?anio=${this.anioVacaciones()}`;
        break;
    }

    window.open(url, '_blank');
  }

  exportToPDF() {
    const reporte = this.selectedReporte();
    let url = `${this.reporteriaService.apiUrl}/${reporte}/export/pdf`;

    // Agregar parámetros según el reporte
    switch (reporte) {
      case 'empleados':
        const fi = this.fechaInicio() ? this.fechaInicio()!.toISOString().split('T')[0] : '';
        const ff = this.fechaFin() ? this.fechaFin()!.toISOString().split('T')[0] : '';
        if (fi) url += `?fechaInicio=${fi}`;
        if (ff) url += `${fi ? '&' : '?'}fechaFin=${ff}`;
        break;
      case 'nomina':
        if (this.mes()) url += `?mes=${this.mes()}`;
        if (this.anio()) url += `${this.mes() ? '&' : '?'}anio=${this.anio()}`;
        break;
      case 'asistencias':
        const fechaInicio = this.fechaInicio()!.toISOString().split('T')[0];
        const fechaFin = this.fechaFin()!.toISOString().split('T')[0];
        url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
        break;
      case 'vacaciones':
        if (this.anioVacaciones()) url += `?anio=${this.anioVacaciones()}`;
        break;
    }

    window.open(url, '_blank');
  }
}