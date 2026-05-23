import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ReporteriaService } from '../services/reporteria.service';

@Component({
  selector: 'app-analisis-salarios',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule,
    ChartModule, SelectModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './analisis-salarios.html',
  styleUrl: './analisis-salarios.css',
})
export class AnalisisSalariosComponent implements OnInit {
  private svc            = inject(ReporteriaService);
  private messageService = inject(MessageService);

  loading      = signal(false);
  salarios     = signal<any[]>([]);
  departamentos= signal<any[]>([]);
  resumen      = signal<any>(null);

  filtroDept   = signal<string>('');
  busqueda     = signal<string>('');

  private readonly PALETTE = [
    '#3b82f6','#22c55e','#f59e0b','#ef4444',
    '#8b5cf6','#06b6d4','#f97316','#ec4899',
    '#14b8a6','#6366f1','#84cc16','#eab308',
  ];

  chartDeptBar:   any = null;
  chartPuestoBar: any = null;
  chartRangos:    any = null;

  readonly chartBase = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  readonly chartDoughnut = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10, padding: 8 } } },
    layout: { padding: 8 },
  };

  salariosVigentes = computed(() =>
    this.salarios().filter(s => !s.FechaFinVigencia)
  );

  salariosDisplay = computed(() => {
    let list = this.salariosVigentes();
    if (this.filtroDept()) list = list.filter(s => s.Departamento === this.filtroDept());
    const q = this.busqueda().toLowerCase().trim();
    if (q) list = list.filter(s => s.NombreEmpleado?.toLowerCase().includes(q) || s.Puesto?.toLowerCase().includes(q));
    return list;
  });

  departamentosOpciones = computed(() => {
    const depts = [...new Set(this.salariosVigentes().map(s => s.Departamento).filter(Boolean))].sort();
    return [{ label: 'Todos los departamentos', value: '' }, ...depts.map(d => ({ label: d, value: d }))];
  });

  // KPIs calculados de los salarios vigentes
  kpis = computed(() => {
    const vals = this.salariosVigentes().map(s => Number(s.SalarioBase) || 0).filter(v => v > 0);
    if (!vals.length) return { promedio: 0, maximo: 0, minimo: 0, mediana: 0, total: 0, cantidad: 0 };
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const mediana = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return {
      promedio: vals.reduce((a, v) => a + v, 0) / vals.length,
      maximo:   Math.max(...vals),
      minimo:   Math.min(...vals),
      mediana,
      total:    vals.reduce((a, v) => a + v, 0),
      cantidad: vals.length,
    };
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    let done = 0;
    const finish = () => { if (++done === 2) this.loading.set(false); };

    this.svc.getReporteSalarios().subscribe({
      next: (d) => { this.salarios.set(d); this.buildCharts(); finish(); },
      error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los salarios' }); finish(); },
    });

    this.svc.getReporteDepartamentos().subscribe({
      next: (d) => { this.departamentos.set(d); this.buildCharts(); finish(); },
      error: () => finish(),
    });
  }

  private buildCharts() {
    // Necesitamos ambos cargados
    const vigentes = this.salarios().filter(s => !s.FechaFinVigencia);
    if (!vigentes.length) return;

    // 1. Masa salarial por departamento (barras)
    const porDept: Record<string, number> = {};
    for (const s of vigentes) {
      const d = s.Departamento ?? 'Sin depto.';
      porDept[d] = (porDept[d] ?? 0) + (Number(s.SalarioBase) || 0);
    }
    const deptLabels = Object.keys(porDept).sort();
    this.chartDeptBar = {
      labels: deptLabels,
      datasets: [{
        label: 'Masa salarial (Q)',
        data: deptLabels.map(d => porDept[d]),
        backgroundColor: deptLabels.map((_, i) => this.PALETTE[i % this.PALETTE.length]),
        borderRadius: 5,
      }],
    };

    // 2. Salario promedio por puesto (barras horizontales)
    const porPuesto: Record<string, number[]> = {};
    for (const s of vigentes) {
      const p = s.Puesto ?? 'Sin puesto';
      if (!porPuesto[p]) porPuesto[p] = [];
      porPuesto[p].push(Number(s.SalarioBase) || 0);
    }
    const puestoLabels = Object.keys(porPuesto).sort();
    const promediosPuesto = puestoLabels.map(p => {
      const vals = porPuesto[p];
      return vals.reduce((a, v) => a + v, 0) / vals.length;
    });
    this.chartPuestoBar = {
      labels: puestoLabels,
      datasets: [{
        label: 'Salario promedio (Q)',
        data: promediosPuesto,
        backgroundColor: puestoLabels.map((_, i) => this.PALETTE[i % this.PALETTE.length] + 'cc'),
        borderColor:     puestoLabels.map((_, i) => this.PALETTE[i % this.PALETTE.length]),
        borderWidth: 1,
        borderRadius: 5,
      }],
    };

    // 3. Distribución por rangos
    const rangos = [
      { label: '< Q2,000',           min: 0,     max: 2000  },
      { label: 'Q2,000 – Q4,000',    min: 2000,  max: 4000  },
      { label: 'Q4,000 – Q6,000',    min: 4000,  max: 6000  },
      { label: 'Q6,000 – Q10,000',   min: 6000,  max: 10000 },
      { label: 'Q10,000 – Q20,000',  min: 10000, max: 20000 },
      { label: '> Q20,000',          min: 20000, max: Infinity },
    ];
    const counts = rangos.map(r => vigentes.filter(s => {
      const v = Number(s.SalarioBase) || 0;
      return v >= r.min && v < r.max;
    }).length);
    this.chartRangos = {
      labels: rangos.map(r => r.label),
      datasets: [{
        label: 'Empleados',
        data: counts,
        backgroundColor: ['#64748b','#3b82f6','#22c55e','#f59e0b','#f97316','#ef4444'],
        borderRadius: 5,
      }],
    };
  }

  getSalarioBadge(salario: number): 'success' | 'warn' | 'info' | 'secondary' {
    if (salario >= 10000) return 'success';
    if (salario >= 5000)  return 'warn';
    if (salario >= 2000)  return 'info';
    return 'secondary';
  }

  getSalarioRango(salario: number): string {
    if (salario >= 10000) return 'Alto';
    if (salario >= 5000)  return 'Medio-Alto';
    if (salario >= 2000)  return 'Medio';
    return 'Básico';
  }

  getDiffPct(salario: number): number {
    const prom = this.kpis().promedio;
    return prom > 0 ? ((salario - prom) / prom) * 100 : 0;
  }

  totalFiltrado = computed(() =>
    this.salariosDisplay().reduce((a, s) => a + (Number(s.SalarioBase) || 0), 0)
  );
}
