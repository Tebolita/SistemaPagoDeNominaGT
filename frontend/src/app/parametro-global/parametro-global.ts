import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ParametroGlobalService } from '../services/parametro-global.service';
import { DepartamentoService } from '../services/departamento.service';
import { PuestoService } from '../services/puesto.service';
import { JornadaLaboralService } from '../services/jornada-laboral.service';
import { ParametroGlobal } from '../models/ParametroGlobal.model';

interface ParamMeta {
  tipo: 'INGRESO' | 'DESCUENTO' | 'REFERENCIA';
  unidad: '%' | 'Q';
  descripcion: string;
}

@Component({
  selector: 'app-parametro-global',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SelectModule,
    DividerModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './parametro-global.html',
  styleUrl: './parametro-global.css',
})
export class ParametroGlobalComponent implements OnInit {
  private parametroService    = inject(ParametroGlobalService);
  private departamentoService = inject(DepartamentoService);
  private puestoService       = inject(PuestoService);
  private jornadaService      = inject(JornadaLaboralService);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  parametros   = signal<ParametroGlobal[]>([]);
  displayDialog = signal(false);
  isEditMode    = signal(false);

  // ── Simulador ────────────────────────────────────────────────────────────
  departamentos = signal<any[]>([]);
  puestos       = signal<any[]>([]);
  jornadas      = signal<any[]>([]);

  simuladorFiltros = {
    IdParametro:    null as number | null,
    Genero:         null as boolean | null,
    IdDepartamento: null as number | null,
    IdPuesto:       null as number | null,
    IdJornada:      null as number | null,
  };

  simuladorResultado = signal<any | null>(null);
  simulandoLoading   = signal(false);

  generosOpciones = [
    { label: 'Masculino', value: false },
    { label: 'Femenino',  value: true  },
  ];
  form: {
    NombreParametro: string;
    Valor: number;
    Descripcion?: string;
    Tipo?: 'INGRESO' | 'DESCUENTO' | 'REFERENCIA';
    Unidad?: '%' | 'Q';
    FiltroGenero?: boolean | null;
    FiltroIdDepartamento?: number | null;
    FiltroIdPuesto?: number | null;
    FiltroIdJornada?: number | null;
  } = { NombreParametro: '', Valor: 0, Descripcion: '', Tipo: undefined, Unidad: undefined,
        FiltroGenero: null, FiltroIdDepartamento: null, FiltroIdPuesto: null, FiltroIdJornada: null };

  readonly tiposOpciones: { label: string; value: 'INGRESO' | 'DESCUENTO' | 'REFERENCIA' }[] = [
    { label: '▲ Ingreso — suma al empleado',    value: 'INGRESO' },
    { label: '▼ Descuento — resta al empleado', value: 'DESCUENTO' },
    { label: '◆ Referencia — umbral o límite',  value: 'REFERENCIA' },
  ];

  readonly unidadesOpciones: { label: string; value: '%' | 'Q' }[] = [
    { label: '% — Porcentaje del salario',    value: '%' },
    { label: 'Q — Monto fijo en quetzales',   value: 'Q' },
  ];
  selectedParametro: ParametroGlobal | null = null;

  readonly PARAM_META: Record<string, ParamMeta> = {
    // ── Descuentos al empleado ──────────────────────────────────────────
    IGSS_EMPLEADO: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'Cuota IGSS descontada al empleado (3.67% del salario)',
    },
    ISR_TASA_1: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'ISR Tramo 1 — primeros Q141,600 sobre la base exenta',
    },
    ISR_TASA_2: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'ISR Tramo 2 — siguientes Q93,400',
    },
    ISR_TASA_3: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'ISR Tramo 3 — siguientes Q141,000',
    },
    ISR_TASA_4: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'ISR Tramo 4 — siguientes Q376,000',
    },
    ISR_TASA_5: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'ISR Tramo 5 — siguientes Q752,000',
    },
    ISR_TASA_6: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'ISR Tramo 6 — excedente de Q1,504,000',
    },
    IRTRA_PORCENTAJE: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'Aporte IRTRA descontado al empleado',
    },
    INTECAP_PORCENTAJE: {
      tipo: 'DESCUENTO',
      unidad: '%',
      descripcion: 'Aporte INTECAP descontado al empleado',
    },
    // ── Ingresos al empleado ────────────────────────────────────────────
    BONO_14_PORCENTAJE: {
      tipo: 'INGRESO',
      unidad: '%',
      descripcion: 'Provisión mensual Bono 14 (8.33% = 1/12 del salario anual)',
    },
    AGUINALDO_PORCENTAJE: {
      tipo: 'INGRESO',
      unidad: '%',
      descripcion: 'Provisión mensual Aguinaldo (8.33% = 1/12 del salario anual)',
    },
    BONO_PRODUCTIVIDAD: {
      tipo: 'INGRESO',
      unidad: 'Q',
      descripcion: 'Bono de productividad fijo mensual adicional al salario',
    },
    // ── Referencia (umbrales, no suman ni descuentan directamente) ──────
    ISR_BASE_ANUAL: {
      tipo: 'REFERENCIA',
      unidad: 'Q',
      descripcion: 'Renta anual exenta; el ISR aplica solo sobre el excedente de este monto',
    },
  };

  ngOnInit() {
    this.loadParametros();
    this.loadCatalogos();
  }

  loadCatalogos() {
    this.departamentoService.getAll().subscribe({ next: d => this.departamentos.set(d), error: () => {} });
    this.puestoService.getAll().subscribe({ next: d => this.puestos.set(d), error: () => {} });
    this.jornadaService.getAll().subscribe({ next: d => this.jornadas.set(d), error: () => {} });
  }

  simular() {
    if (!this.simuladorFiltros.IdParametro) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona un parámetro para simular.' });
      return;
    }
    this.simulandoLoading.set(true);
    this.simuladorResultado.set(null);
    const payload = {
      IdParametro:    this.simuladorFiltros.IdParametro,
      Genero:         this.simuladorFiltros.Genero,
      IdDepartamento: this.simuladorFiltros.IdDepartamento,
      IdPuesto:       this.simuladorFiltros.IdPuesto,
      IdJornada:      this.simuladorFiltros.IdJornada,
    };
    this.parametroService.simular(payload).subscribe({
      next: (data) => { this.simuladorResultado.set(data); this.simulandoLoading.set(false); },
      error: (err) => {
        this.simulandoLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.message });
      },
    });
  }

  limpiarSimulador() {
    this.simuladorFiltros = { IdParametro: null, Genero: null, IdDepartamento: null, IdPuesto: null, IdJornada: null };
    this.simuladorResultado.set(null);
  }

  loadParametros() {
    this.parametroService.getAll().subscribe({
      next: (data) => this.parametros.set(data),
      error: (err) =>
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  getMeta(nombre: string, param?: ParametroGlobal): ParamMeta {
    if (param?.Tipo && param?.Unidad) {
      return {
        tipo: param.Tipo as ParamMeta['tipo'],
        unidad: param.Unidad as ParamMeta['unidad'],
        descripcion: param.Descripcion || this.PARAM_META[nombre]?.descripcion || '—',
      };
    }
    return (
      this.PARAM_META[nombre] ?? { tipo: 'REFERENCIA', unidad: 'Q', descripcion: '—' }
    );
  }

  getTipoSeverity(tipo: string): 'success' | 'danger' | 'secondary' {
    if (tipo === 'INGRESO') return 'success';
    if (tipo === 'DESCUENTO') return 'danger';
    return 'secondary';
  }

  getTipoLabel(tipo: string): string {
    if (tipo === 'INGRESO') return '▲ Ingreso';
    if (tipo === 'DESCUENTO') return '▼ Descuento';
    return '◆ Referencia';
  }

  formatValor(param: ParametroGlobal): string {
    const meta = this.getMeta(param.NombreParametro, param);
    const val = Number(param.Valor);
    if (meta.unidad === '%') return `${val.toFixed(2)} %`;
    return `Q ${val.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }

  getFiltrosLabel(param: ParametroGlobal): string {
    const partes: string[] = [];
    if (param.FiltroGenero !== null && param.FiltroGenero !== undefined)
      partes.push(param.FiltroGenero ? 'Femenino' : 'Masculino');
    if (param.Departamento?.NombreDepartamento)
      partes.push(param.Departamento.NombreDepartamento);
    if (param.Puesto?.NombrePuesto)
      partes.push(param.Puesto.NombrePuesto);
    if (param.JornadaLaboral?.NombreJornada)
      partes.push(param.JornadaLaboral.NombreJornada);
    return partes.length ? partes.join(' · ') : 'Todos';
  }

  tieneFiltros(param: ParametroGlobal): boolean {
    return param.FiltroGenero !== null && param.FiltroGenero !== undefined
      || !!param.FiltroIdDepartamento
      || !!param.FiltroIdPuesto
      || !!param.FiltroIdJornada;
  }

  getParamsOrdenados(): ParametroGlobal[] {
    const orden: Record<string, number> = { INGRESO: 0, DESCUENTO: 1, REFERENCIA: 2 };
    return [...this.parametros()].sort((a, b) => {
      const ta = orden[this.getMeta(a.NombreParametro).tipo] ?? 3;
      const tb = orden[this.getMeta(b.NombreParametro).tipo] ?? 3;
      return ta - tb || a.NombreParametro.localeCompare(b.NombreParametro);
    });
  }

  showDialog() {
    this.isEditMode.set(false);
    this.form = {
      NombreParametro: '', Valor: 0, Descripcion: '', Tipo: undefined, Unidad: undefined,
      FiltroGenero: null, FiltroIdDepartamento: null, FiltroIdPuesto: null, FiltroIdJornada: null,
    };
    this.selectedParametro = null;
    this.displayDialog.set(true);
  }

  editParametro(param: ParametroGlobal) {
    this.isEditMode.set(true);
    this.form = {
      NombreParametro:      param.NombreParametro,
      Valor:                Number(param.Valor),
      Descripcion:          param.Descripcion ?? '',
      Tipo:                 param.Tipo,
      Unidad:               param.Unidad,
      FiltroGenero:         param.FiltroGenero ?? null,
      FiltroIdDepartamento: param.FiltroIdDepartamento ?? null,
      FiltroIdPuesto:       param.FiltroIdPuesto ?? null,
      FiltroIdJornada:      param.FiltroIdJornada ?? null,
    };
    this.selectedParametro = param;
    this.displayDialog.set(true);
  }

  saveParametro() {
    if (!this.form.NombreParametro || this.form.Valor === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Completa los campos obligatorios',
      });
      return;
    }

    const obs = this.isEditMode() && this.selectedParametro
      ? this.parametroService.update(this.selectedParametro.IdParametro, this.form)
      : this.parametroService.create(this.form);

    obs.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode() ? 'Actualizado' : 'Creado',
          detail: 'Parámetro guardado correctamente',
        });
        this.displayDialog.set(false);
        this.loadParametros();
      },
      error: (err) =>
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
    });
  }

  deleteParametro(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar este parámetro?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.parametroService.delete(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: 'Parámetro eliminado',
            });
            this.loadParametros();
          },
          error: (err) =>
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message }),
        });
      },
    });
  }
}
