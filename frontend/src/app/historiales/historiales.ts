import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ReporteriaService } from '../services/reporteria.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-historiales',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, SelectModule,
    DatePickerModule, TagModule, ToastModule, TabsModule,
  ],
  providers: [MessageService],
  templateUrl: './historiales.html',
  styleUrl: './historiales.css',
})
export class HistorialesComponent implements OnInit {
  private svc            = inject(ReporteriaService);
  private messageService = inject(MessageService);
  private http           = inject(HttpClient);

  tabActivo = 'salarios';
  loading   = signal(false);

  salarios      = signal<any[]>([]);
  nominas       = signal<any[]>([]);
  asistencias   = signal<any[]>([]);
  vacaciones    = signal<any[]>([]);

  // Filtros
  fechaInicio   = signal<Date | null>(null);
  fechaFin      = signal<Date | null>(null);
  mes           = signal<number | null>(null);
  anio          = signal<number | null>(null);
  anioVac       = signal<number | null>(null);

  readonly anioActual = new Date().getFullYear();
  anios: { label: string; value: number }[] = [];
  readonly meses = [
    { label: 'Enero', value: 1 },   { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },   { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },   { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 }, { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 },
  ];

  ngOnInit() {
    for (let i = this.anioActual; i >= this.anioActual - 5; i--)
      this.anios.push({ label: i.toString(), value: i });
    this.cargarTab('salarios');
  }

  onTabChange(tab: string | number | undefined) {
    const t = String(tab ?? 'salarios');
    this.tabActivo = t;
    this.cargarTab(t);
  }

  cargarTab(tab: string) {
    this.loading.set(true);
    const ok  = (setter: any) => (d: any) => { setter(d); this.loading.set(false); };
    const err = () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial' }); this.loading.set(false); };

    if (tab === 'salarios') {
      this.svc.getReporteSalarios().subscribe({ next: ok((d: any) => this.salarios.set(d)), error: err });
    } else if (tab === 'nominas') {
      this.svc.getReporteNomina(this.mes() ?? undefined, this.anio() ?? undefined)
        .subscribe({ next: ok((d: any) => this.nominas.set(d)), error: err });
    } else if (tab === 'asistencias') {
      const fi = this.fechaInicio()?.toISOString().split('T')[0];
      const ff = this.fechaFin()?.toISOString().split('T')[0];
      if (!fi || !ff) { this.loading.set(false); return; }
      this.svc.getReporteAsistencias(fi, ff).subscribe({ next: ok((d: any) => this.asistencias.set(d)), error: err });
    } else if (tab === 'vacaciones') {
      this.svc.getReporteVacaciones(this.anioVac() ?? undefined)
        .subscribe({ next: ok((d: any) => this.vacaciones.set(d)), error: err });
    }
  }

  buscar() { this.cargarTab(this.tabActivo); }

  exportar(tipo: 'excel' | 'pdf') {
    const ext = tipo === 'excel' ? 'xlsx' : 'pdf';
    const tabMap: Record<string, string> = { salarios: 'salarios', nominas: 'nomina', asistencias: 'asistencias', vacaciones: 'vacaciones' };
    const endpoint = tabMap[this.tabActivo];
    if (!endpoint) return;
    const params = new URLSearchParams();
    if (this.tabActivo === 'nominas') {
      if (this.mes()) params.set('mes', String(this.mes()));
      if (this.anio()) params.set('anio', String(this.anio()));
    } else if (this.tabActivo === 'asistencias') {
      const fi = this.fechaInicio()?.toISOString().split('T')[0];
      const ff = this.fechaFin()?.toISOString().split('T')[0];
      if (fi) params.set('fechaInicio', fi);
      if (ff) params.set('fechaFin', ff);
    } else if (this.tabActivo === 'vacaciones') {
      if (this.anioVac()) params.set('anio', String(this.anioVac()));
    }
    const qs  = params.toString();
    const url = `${this.svc.apiUrl}/${endpoint}/export/${tipo}${qs ? '?' + qs : ''}`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `historial-${endpoint}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar' }),
    });
  }

  sumNomina(nomina: any, field: string) {
    return (nomina.Detalle ?? []).reduce((a: number, d: any) => a + (Number(d[field]) || 0), 0);
  }
}
