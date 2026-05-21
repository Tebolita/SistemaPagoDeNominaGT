import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { ReporteriaService } from '../services/reporteria.service';

interface ReporteConfig {
  label: string;
  value: string;
  icon: string;
  desc: string;
}

@Component({
  selector: 'app-reporteria',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, SelectModule,
    DatePickerModule, TagModule, ToastModule, TooltipModule, ChartModule,
  ],
  providers: [MessageService],
  templateUrl: './reporteria.html',
  styleUrl: './reporteria.css',
})
export class Reporteria implements OnInit {
  private reporteriaService = inject(ReporteriaService);
  private messageService    = inject(MessageService);
  private http              = inject(HttpClient);

  readonly reportes: ReporteConfig[] = [
    { label: 'Resumen Ejecutivo',  value: 'resumen',       icon: 'pi pi-chart-pie',   desc: 'KPIs generales del sistema' },
    { label: 'Empleados',          value: 'empleados',     icon: 'pi pi-users',       desc: 'Plantilla activa con salarios' },
    { label: 'Salarios',           value: 'salarios',      icon: 'pi pi-dollar',      desc: 'Historial de salarios por empleado' },
    { label: 'Departamentos',      value: 'departamentos', icon: 'pi pi-building',    desc: 'Masa salarial por departamento' },
    { label: 'Nómina',             value: 'nomina',        icon: 'pi pi-calculator',  desc: 'Planillas generadas por período' },
    { label: 'Asistencias',        value: 'asistencias',   icon: 'pi pi-clock',       desc: 'Registros de entrada/salida' },
    { label: 'Vacaciones',         value: 'vacaciones',    icon: 'pi pi-sun',         desc: 'Días ganados y gozados' },
  ];

  selectedReporte = signal<string>('resumen');
  loading         = signal<boolean>(false);

  resumen       = signal<any>(null);
  empleados     = signal<any[]>([]);
  salarios      = signal<any[]>([]);
  departamentos = signal<any[]>([]);
  nominas       = signal<any[]>([]);
  asistencias   = signal<any[]>([]);
  vacaciones    = signal<any[]>([]);

  // Charts
  chartEmpleados:        any = null;
  chartSalarios:         any = null;
  chartTendencia:        any = null;
  chartDistribucion:     any = null;
  chartEstados:          any = null;
  chartDescuentos:       any = null;

  private readonly BASE_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  chartOptions        = { ...this.BASE_OPTS };
  chartOptionsNoLeg   = { ...this.BASE_OPTS, plugins: { legend: { display: false } } };

  // Barras apiladas — requiere stacked:true en ambos ejes para que Chart.js apile correctamente
  chartOptionsStacked = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          footer: (items: any[]) => {
            const total = items.reduce((s: number, i: any) => s + i.parsed.y, 0);
            return `Total bruto: Q ${total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        stacked: true,
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };
  // Leyenda abajo — para donuts en columnas estrechas (1/3 del grid)
  chartOptionsDoughnut = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10, padding: 10 },
      },
    },
    layout: { padding: { top: 8, bottom: 4 } },
  };

  // Leyenda derecha — para donuts en columna amplia (2/3 del grid o standalone)
  chartOptionsDoughnutWide = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12, padding: 12 },
      },
    },
    layout: { padding: 8 },
  };

  fechaInicio      = signal<Date | null>(null);
  fechaFin         = signal<Date | null>(null);
  mes              = signal<number | null>(null);
  anio             = signal<number | null>(null);
  anioVacaciones   = signal<number | null>(null);

  readonly meses = [
    { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 }, { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },  { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 }, { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  anios: { label: string; value: number }[] = [];
  readonly anioActual = new Date().getFullYear();

  ngOnInit() {
    for (let i = this.anioActual; i >= this.anioActual - 5; i--) {
      this.anios.push({ label: i.toString(), value: i });
    }
    this.loadReporte();
  }

  getReporteConfig(): ReporteConfig {
    return this.reportes.find(r => r.value === this.selectedReporte())
      ?? this.reportes[0];
  }

  onReporteChange() { this.loadReporte(); }

  loadReporte() {
    this.loading.set(true);
    const reporte = this.selectedReporte();

    const handlers: Record<string, () => void> = {
      resumen:       () => this.loadResumen(),
      empleados:     () => this.loadEmpleados(),
      salarios:      () => this.loadSalarios(),
      departamentos: () => this.loadDepartamentos(),
      nomina:        () => this.loadNomina(),
      asistencias:   () => this.loadAsistencias(),
      vacaciones:    () => this.loadVacaciones(),
    };

    handlers[reporte]?.();
  }

  private done = () => this.loading.set(false);
  private fail = (msg: string) => {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
    this.loading.set(false);
  };

  loadResumen() {
    this.reporteriaService.getResumenEjecutivo().subscribe({
      next: d => {
        this.resumen.set(d);
        this.buildCharts(d);
        this.done();
      },
      error: () => this.fail('Error al cargar resumen'),
    });
  }

  private readonly PALETTE = [
    '#3b82f6','#22c55e','#f59e0b','#ef4444',
    '#8b5cf6','#06b6d4','#f97316','#ec4899',
    '#14b8a6','#6366f1','#84cc16','#eab308',
  ];

  private buildCharts(d: any) {
    const depts: any[] = d.empleadosPorDepartamento ?? [];
    const deptLabels = depts.map((x: any) => x.departamento);
    const colors     = depts.map((_: any, i: number) => this.PALETTE[i % this.PALETTE.length]);

    // 1. Empleados por departamento — barras horizontales
    this.chartEmpleados = {
      labels: deptLabels,
      datasets: [{
        label: 'Empleados',
        data: depts.map((x: any) => x.cantidad),
        backgroundColor: colors,
        borderRadius: 4,
      }],
    };

    // 2. Masa salarial por departamento — doughnut
    this.chartSalarios = {
      labels: deptLabels,
      datasets: [{
        data: depts.map((x: any) => x.masaSalarial),
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#1e293b',
      }],
    };

    // 3. Tendencia de nómina — línea multi-serie
    const tend: any[] = d.tendenciaNomina ?? [];
    this.chartTendencia = {
      labels: tend.map((t: any) => t.label),
      datasets: [
        {
          label: 'Líquido a Pagar (Q)',
          data: tend.map((t: any) => t.totalLiquido),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.12)',
          fill: true, tension: 0.4, pointBackgroundColor: '#22c55e', pointRadius: 4,
        },
        {
          label: 'Total Sueldos (Q)',
          data: tend.map((t: any) => t.totalSueldos),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          fill: false, tension: 0.4, pointBackgroundColor: '#3b82f6', borderDash: [4, 4],
        },
        {
          label: 'Descuentos (Q)',
          data: tend.map((t: any) => t.totalDescuentos),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          fill: false, tension: 0.4, pointBackgroundColor: '#ef4444', borderDash: [2, 2],
        },
      ],
    };

    // 4. Distribución salarial — barras
    const dist: any[] = d.distribucionSalarial ?? [];
    this.chartDistribucion = {
      labels: dist.map((r: any) => r.label),
      datasets: [{
        label: 'Empleados',
        data: dist.map((r: any) => r.cantidad),
        backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#8b5cf6'],
        borderRadius: 4,
      }],
    };

    // 5. Nóminas por estado — doughnut
    const estados: any[] = d.nominasEstado ?? [];
    const estadoColors: Record<string, string> = {
      BORRADOR: '#64748b', PENDIENTE_APROBACION: '#f59e0b',
      APROBADO: '#22c55e', PAGADO: '#3b82f6', CANCELADO: '#ef4444',
    };
    this.chartEstados = {
      labels: estados.map((e: any) => e.estado),
      datasets: [{
        data: estados.map((e: any) => e.cantidad),
        backgroundColor: estados.map((e: any) => estadoColors[e.estado] ?? '#94a3b8'),
        borderWidth: 2, borderColor: '#1e293b',
      }],
    };

    // 6. Composición de nómina — apilado: Líquido (base) + Descuentos (encima)
    // La barra total = sueldo bruto. El verde (fondo) siempre es mayor que el rojo (encima).
    this.chartDescuentos = {
      labels: tend.map((t: any) => t.label),
      datasets: [
        {
          label: 'Líquido a pagar (Q)',
          data: tend.map((t: any) => t.totalLiquido),
          backgroundColor: 'rgba(34,197,94,0.75)',
          borderColor: 'rgba(34,197,94,0.9)',
          borderWidth: 1,
          stack: 'salario',
        },
        {
          label: 'Total descuentos (Q)',
          data: tend.map((t: any) => t.totalDescuentos),
          backgroundColor: 'rgba(239,68,68,0.65)',
          borderColor: 'rgba(239,68,68,0.85)',
          borderWidth: 1,
          stack: 'salario',
        },
      ],
    };
  }

  loadEmpleados() {
    const fi = this.fechaInicio()?.toISOString().split('T')[0];
    const ff = this.fechaFin()?.toISOString().split('T')[0];
    this.reporteriaService.getReporteEmpleados(fi, ff).subscribe({
      next: d => { this.empleados.set(d); this.done(); },
      error: () => this.fail('Error al cargar empleados'),
    });
  }

  loadSalarios() {
    this.reporteriaService.getReporteSalarios().subscribe({
      next: d => { this.salarios.set(d); this.done(); },
      error: () => this.fail('Error al cargar salarios'),
    });
  }

  loadDepartamentos() {
    this.reporteriaService.getReporteDepartamentos().subscribe({
      next: d => { this.departamentos.set(d); this.done(); },
      error: () => this.fail('Error al cargar departamentos'),
    });
  }

  loadNomina() {
    this.reporteriaService.getReporteNomina(this.mes() ?? undefined, this.anio() ?? undefined).subscribe({
      next: d => { this.nominas.set(d); this.done(); },
      error: () => this.fail('Error al cargar nómina'),
    });
  }

  loadAsistencias() {
    if (!this.fechaInicio() || !this.fechaFin()) {
      this.messageService.add({ severity: 'warn', summary: 'Filtro requerido', detail: 'Selecciona el rango de fechas' });
      this.loading.set(false);
      return;
    }
    const fi = this.fechaInicio()!.toISOString().split('T')[0];
    const ff = this.fechaFin()!.toISOString().split('T')[0];
    this.reporteriaService.getReporteAsistencias(fi, ff).subscribe({
      next: d => { this.asistencias.set(d); this.done(); },
      error: () => this.fail('Error al cargar asistencias'),
    });
  }

  loadVacaciones() {
    this.reporteriaService.getReporteVacaciones(this.anioVacaciones() ?? undefined).subscribe({
      next: d => { this.vacaciones.set(d); this.done(); },
      error: () => this.fail('Error al cargar vacaciones'),
    });
  }

  // ── Totales helpers ────────────────────────────────────────────────
  sumDept(field: string): number {
    return this.departamentos().reduce((a, d) => a + (Number(d[field]) || 0), 0);
  }

  // ── Exportaciones con blob (evita 401 de window.open) ─────────────
  private buildUrl(tipo: 'excel' | 'pdf'): { url: string; filename: string } {
    const reporte = this.selectedReporte();
    const ext = tipo === 'excel' ? 'xlsx' : 'pdf';
    const params = new URLSearchParams();

    if (reporte === 'empleados') {
      const fi = this.fechaInicio()?.toISOString().split('T')[0] ?? '';
      const ff = this.fechaFin()?.toISOString().split('T')[0] ?? '';
      if (fi) params.set('fechaInicio', fi);
      if (ff) params.set('fechaFin', ff);
    } else if (reporte === 'nomina') {
      if (this.mes()) params.set('mes', String(this.mes()));
      if (this.anio()) params.set('anio', String(this.anio()));
    } else if (reporte === 'asistencias') {
      params.set('fechaInicio', this.fechaInicio()!.toISOString().split('T')[0]);
      params.set('fechaFin', this.fechaFin()!.toISOString().split('T')[0]);
    } else if (reporte === 'vacaciones') {
      if (this.anioVacaciones()) params.set('anio', String(this.anioVacaciones()));
    }

    const qs = params.toString();
    const url = `${this.reporteriaService.apiUrl}/${reporte}/export/${tipo}${qs ? '?' + qs : ''}`;
    const label = this.getReporteConfig().label.replace(/\s+/g, '-');
    return { url, filename: `${label}.${ext}` };
  }

  private downloadBlob(url: string, filename: string) {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => this.fail('No se pudo generar el archivo'),
    });
  }

  exportToExcel() {
    const { url, filename } = this.buildUrl('excel');
    this.downloadBlob(url, filename);
  }

  exportToPDF() {
    const { url, filename } = this.buildUrl('pdf');
    this.downloadBlob(url, filename);
  }
}
