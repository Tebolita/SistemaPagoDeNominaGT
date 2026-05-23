import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ReporteriaService } from '../services/reporteria.service';

@Component({
  selector: 'app-informes-ejecutivos',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, ToastModule, ChartModule, TooltipModule],
  providers: [MessageService],
  templateUrl: './informes-ejecutivos.html',
  styleUrl: './informes-ejecutivos.css',
})
export class InformesEjecutivosComponent implements OnInit {
  private svc            = inject(ReporteriaService);
  private messageService = inject(MessageService);

  loading = signal(false);
  data    = signal<any>(null);

  chartEmpleados: any    = null;
  chartSalarios: any     = null;
  chartTendencia: any    = null;
  chartDistribucion: any = null;
  chartEstados: any      = null;
  chartDescuentos: any   = null;

  private readonly PALETTE = [
    '#3b82f6','#22c55e','#f59e0b','#ef4444',
    '#8b5cf6','#06b6d4','#f97316','#ec4899',
    '#14b8a6','#6366f1','#84cc16','#eab308',
  ];

  readonly chartBase = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  readonly chartNoLeg   = { ...this.chartBase, plugins: { legend: { display: false } } };
  readonly chartDoughnut = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10, padding: 8 } } },
    layout: { padding: { top: 8, bottom: 4 } },
  };
  readonly chartStacked = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          footer: (items: any[]) => {
            const total = items.reduce((s: number, i: any) => s + i.parsed.y, 0);
            return `Total: Q ${total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    },
  };

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.svc.getResumenEjecutivo().subscribe({
      next: (d) => {
        this.data.set(d);
        this.buildCharts(d);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el resumen ejecutivo' });
        this.loading.set(false);
      },
    });
  }

  private buildCharts(d: any) {
    const depts  = d.empleadosPorDepartamento ?? [];
    const labels = depts.map((x: any) => x.departamento);
    const colors = depts.map((_: any, i: number) => this.PALETTE[i % this.PALETTE.length]);

    this.chartEmpleados = {
      labels,
      datasets: [{ label: 'Empleados', data: depts.map((x: any) => x.cantidad), backgroundColor: colors, borderRadius: 5 }],
    };

    this.chartSalarios = {
      labels,
      datasets: [{ data: depts.map((x: any) => x.masaSalarial), backgroundColor: colors, borderWidth: 2, borderColor: '#0f172a' }],
    };

    const tend: any[] = d.tendenciaNomina ?? [];
    this.chartTendencia = {
      labels: tend.map((t: any) => t.label),
      datasets: [
        { label: 'Líquido (Q)', data: tend.map((t: any) => t.totalLiquido), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
        { label: 'Sueldos (Q)', data: tend.map((t: any) => t.totalSueldos), borderColor: '#3b82f6', backgroundColor: 'transparent', fill: false, tension: 0.4, borderDash: [4, 4] },
        { label: 'Descuentos (Q)', data: tend.map((t: any) => t.totalDescuentos), borderColor: '#ef4444', backgroundColor: 'transparent', fill: false, tension: 0.4, borderDash: [2, 2] },
      ],
    };

    const dist: any[] = d.distribucionSalarial ?? [];
    this.chartDistribucion = {
      labels: dist.map((r: any) => r.label),
      datasets: [{ data: dist.map((r: any) => r.cantidad), backgroundColor: ['#3b82f6','#22c55e','#f59e0b','#8b5cf6'], borderWidth: 2, borderColor: '#0f172a' }],
    };

    const estadoColors: Record<string, string> = { BORRADOR: '#64748b', PENDIENTE_APROBACION: '#f59e0b', APROBADO: '#22c55e', PAGADO: '#3b82f6', CANCELADO: '#ef4444' };
    const estados: any[] = d.nominasEstado ?? [];
    this.chartEstados = {
      labels: estados.map((e: any) => e.estado),
      datasets: [{ data: estados.map((e: any) => e.cantidad), backgroundColor: estados.map((e: any) => estadoColors[e.estado] ?? '#94a3b8'), borderWidth: 2, borderColor: '#0f172a' }],
    };

    this.chartDescuentos = {
      labels: tend.map((t: any) => t.label),
      datasets: [
        { label: 'Líquido (Q)', data: tend.map((t: any) => t.totalLiquido), backgroundColor: 'rgba(34,197,94,0.75)', borderColor: 'rgba(34,197,94,0.9)', borderWidth: 1, stack: 'n' },
        { label: 'Descuentos (Q)', data: tend.map((t: any) => t.totalDescuentos), backgroundColor: 'rgba(239,68,68,0.65)', borderColor: 'rgba(239,68,68,0.85)', borderWidth: 1, stack: 'n' },
      ],
    };
  }

  get masaSalarialTotal(): number {
    return (this.data()?.empleadosPorDepartamento ?? []).reduce((a: number, d: any) => a + (Number(d.masaSalarial) || 0), 0);
  }
}
