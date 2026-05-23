import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { NominaService } from '../../services/nomina.service';
import { Nomina, NominaDetalle } from '../../models/Nomina.model';
import { HttpClient } from '@angular/common/http';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

@Component({
  selector: 'app-nomina-detalle',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TableModule, ButtonModule, TagModule, ToastModule,
    TooltipModule, SelectModule, DialogModule,
  ],
  providers: [MessageService],
  templateUrl: './nomina-detalle.html',
  styleUrl: './nomina-detalle.css',
})
export class NominaDetalleComponent implements OnInit {
  private nominaService = inject(NominaService);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  nominas        = signal<Nomina[]>([]);
  nominaActual   = signal<Nomina | null>(null);
  loading        = signal(false);
  loadingDetalle = signal(false);
  busqueda       = signal('');
  filtroAnio     = signal<number | null>(null);

  mostrarBoleta  = signal(false);
  boletaEmpleado = signal<NominaDetalle | null>(null);

  readonly anioActual = new Date().getFullYear();
  anios = Array.from({ length: 6 }, (_, i) => ({
    label: String(this.anioActual - i),
    value: this.anioActual - i,
  }));

  nominasFiltradas = computed(() => {
    let list = this.nominas();
    if (this.filtroAnio()) list = list.filter(n => n.Anio === this.filtroAnio());
    const q = this.busqueda().toLowerCase().trim();
    if (q) list = list.filter(n =>
      `${n.Mes}/${n.Anio}`.includes(q) ||
      MESES[(n.Mes ?? 1) - 1].toLowerCase().includes(q) ||
      n.EstadoNomina?.NombreEstado?.toLowerCase().includes(q) ||
      n.TipoNomina?.toLowerCase().includes(q)
    );
    return list;
  });

  // Totales de la nómina seleccionada
  totales = computed(() => {
    const det = this.nominaActual()?.NominaDetalle ?? [];
    return {
      sueldos:        det.reduce((a, d) => a + (d.SueldoBase ?? 0), 0),
      bonificaciones: det.reduce((a, d) => a + (d.BonificacionIncentivo ?? 0), 0),
      otrosIngresos:  det.reduce((a, d) => a + (d.OtrosIngresos ?? 0), 0),
      igss:           det.reduce((a, d) => a + (d.DescuentoIGSS ?? 0), 0),
      isr:            det.reduce((a, d) => a + (d.DescuentoISR ?? 0), 0),
      otrosDesc:      det.reduce((a, d) => a + (d.OtrosDescuentos ?? 0), 0),
      liquido:        det.reduce((a, d) => a + (d.LiquidoRecibir ?? 0), 0),
      empleados:      det.length,
    };
  });

  ngOnInit() { this.cargarNominas(); }

  cargarNominas() {
    this.loading.set(true);
    this.nominaService.getAll().subscribe({
      next: (data) => { this.nominas.set(data); this.loading.set(false); },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loading.set(false);
      },
    });
  }

  seleccionarNomina(nomina: Nomina) {
    if (this.nominaActual()?.IdNomina === nomina.IdNomina) return;
    this.loadingDetalle.set(true);
    this.nominaService.getById(nomina.IdNomina).subscribe({
      next: (data) => { this.nominaActual.set(data); this.loadingDetalle.set(false); },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loadingDetalle.set(false);
      },
    });
  }

  abrirBoleta(detalle: NominaDetalle) {
    this.boletaEmpleado.set(detalle);
    this.mostrarBoleta.set(true);
  }

  getMesPeriodo(mes: number | undefined): string {
    if (!mes) return '—';
    const nombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return nombres[(mes - 1)] ?? '—';
  }

  getMesCorto(mes: number | undefined): string {
    return mes ? MESES[(mes - 1)] : '—';
  }

  getSeverityEstado(estado: string | undefined): 'success' | 'warn' | 'info' | 'danger' | 'secondary' {
    if (!estado) return 'secondary';
    const e = estado.toUpperCase();
    if (e.includes('PAGAD') || e.includes('APROBAD')) return 'success';
    if (e.includes('PENDIENTE') || e.includes('BORRADOR')) return 'warn';
    if (e.includes('CANCELAD')) return 'danger';
    return 'info';
  }

  descargar(tipo: 'general' | 'igss' | 'isr') {
    const nomina = this.nominaActual();
    if (!nomina) return;
    this.nominaService.descargarExcel(nomina.IdNomina, tipo).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `nomina-${nomina.Mes}-${nomina.Anio}-${tipo}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el archivo' }),
    });
  }
}
