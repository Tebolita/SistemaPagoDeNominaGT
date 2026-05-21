import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { NominaService } from '../services/nomina.service';
import { EmpleadoService } from '../services/empleado.service';
import { EstadoNominaService } from '../services/estado-nomina.service';
import { LoginService } from '../services/login.service';
import { CuentaBancariaEmpresaService } from '../services/cuenta-bancaria-empresa.service';
import { CorreoService } from '../services/correo.service';
import { ParametroGlobalService } from '../services/parametro-global.service';
import { ParametroGlobal } from '../models/ParametroGlobal.model';
import { CuentaBancariaEmpresa } from '../models/CuentaBancariaEmpresa.model';
import { FirmaNomina, Nomina, NominaCalculo, NominaMasivaResultado } from '../models/Nomina.model';
import { EmpleadoResponse } from '../models/Empleado.model';
import { EstadoNomina, HistorialEstadoNomina, CambiarEstadoNominaDto } from '../models/EstadoNomina.model';

@Component({
  selector: 'app-nomina',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    TextareaModule,
    MultiSelectModule,
    DividerModule,
    TabsModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './nomina.html',
  styleUrl: './nomina.css',
})
export class NominaComponent implements OnInit {
  private nominaService = inject(NominaService);
  private empleadoService = inject(EmpleadoService);
  private estadoNominaService = inject(EstadoNominaService);
  private authService = inject(LoginService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cuentaService      = inject(CuentaBancariaEmpresaService);
  private correoService      = inject(CorreoService);
  private parametroService   = inject(ParametroGlobalService);
  enviandoCorreo = signal<number | null>(null);

  // ── Filtros de la tabla ───────────────────────────────────────────────────
  filtroAnio: number | null = null;
  filtroMes:  number | null = null;
  filtroTipo: string        = '';

  get aniosFiltro(): { label: string; value: number }[] {
    const unicos = [...new Set(this.nominas().map(n => n.Anio))].sort((a, b) => b - a);
    return unicos.map(a => ({ label: String(a), value: a }));
  }

  get nominasFiltradas(): Nomina[] {
    return this.nominas().filter(n => {
      if (this.filtroAnio && n.Anio !== this.filtroAnio) return false;
      if (this.filtroMes  && n.Mes  !== this.filtroMes)  return false;
      if (this.filtroTipo && n.TipoNomina !== this.filtroTipo) return false;
      return true;
    });
  }

  get totalFiltradas(): { cantidad: number; salario: number; liquido: number } {
    const lista = this.nominasFiltradas;
    return {
      cantidad: lista.length,
      salario:  lista.reduce((s, n) => s + this.getSalarioTotal(n), 0),
      liquido:  lista.reduce((s, n) => s + this.getLiquidoTotal(n), 0),
    };
  }

  limpiarFiltros() {
    this.filtroAnio = null;
    this.filtroMes  = null;
    this.filtroTipo = '';
  }

  contarPorTipo(tipo: string): number {
    return this.nominasFiltradas.filter(n => (n.TipoNomina ?? 'GENERAL') === tipo).length;
  }

  // ── Nómina Personalizada ──────────────────────────────────────────────────
  parametros           = signal<ParametroGlobal[]>([]);
  displayPersonalizada = signal(false);
  formPersonalizada = {
    idEmpleados:        [] as number[],
    idParametros:       [] as number[],
    Mes:                new Date().getMonth() + 1,
    Anio:               new Date().getFullYear(),
    IdCuenta:           null as number | null,
    incluirSalarioBase: true,
  };

  nominas           = signal<Nomina[]>([]);
  nominasEliminadas = signal<Nomina[]>([]);
  tabActivo         = 'activas';
  empleados         = signal<EmpleadoResponse[]>([]);
  estados = signal<EstadoNomina[]>([]);
  estadosDisponibles = signal<EstadoNomina[]>([]);
  historialEstados = signal<HistorialEstadoNomina[]>([]);
  firmasNomina = signal<FirmaNomina[]>([]);
  cuentas = signal<CuentaBancariaEmpresa[]>([]);
  userRole = signal<string>('');

  displayDialog = signal(false);
  displayDetalles = signal(false);
  displayCambiarEstado = signal(false);
  displayHistorial = signal(false);
  displayFirmar = signal(false);
  displayMasiva = signal(false);

  form = {
    IdEmpleado: 0,
    SalarioBase: 0,
    Mes: new Date().getMonth() + 1,
    Anio: new Date().getFullYear(),
    IdCuenta: 0,
  };

  formMasiva = {
    Mes: new Date().getMonth() + 1,
    Anio: new Date().getFullYear(),
    IdCuenta: 0,
  };

  firmaForm = { TipoFirmante: '', Comentarios: '' };
  cambioEstadoForm = { IdEstadoNuevo: 0, NumeroBoleta: '', Comentarios: '', IdCuenta: 0 };
  calculoPreview: NominaCalculo | null = null;
  nominaSeleccionada: Nomina | null = null;

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

  tiposFirmante = [
    { label: 'Jefe de Área', value: 'JEFE_AREA' },
    { label: 'Encargado', value: 'ENCARGADO' },
  ];

  ngOnInit() {
    this.loadUserProfile();
    this.loadNominas();
    this.loadEmpleados();
    this.loadEstados();
    this.loadCuentas();
    this.loadParametros();

    const currentYear = new Date().getFullYear();
    this.anios = Array.from({ length: currentYear - 2019 }, (_, i) => ({
      label: String(currentYear - i),
      value: currentYear - i,
    }));
  }

  private handleError(error: any, defaultMessage = 'Ha ocurrido un error inesperado'): string {
    console.error('Error en nómina:', error);
    return error?.message ?? defaultMessage;
  }

  // ─── Carga de datos ───────────────────────────────────────────────────────

  loadNominas() {
    this.nominaService.getAll().subscribe({
      next: (data) => this.nominas.set(data),
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar nóminas',
          detail: this.handleError(err, 'No se pudieron cargar las nóminas'),
        });
      },
    });
  }

  loadNominasEliminadas() {
    this.nominaService.getEliminadas().subscribe({
      next: (data) => this.nominasEliminadas.set(data),
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.handleError(err, 'No se pudieron cargar las nóminas eliminadas'),
        });
      },
    });
  }

  onTabChange(tab: string | number | undefined) {
    if (!tab) return;
    this.tabActivo = String(tab);
    if (tab === 'eliminadas') this.loadNominasEliminadas();
  }

  restaurarNomina(nomina: Nomina) {
    this.confirmationService.confirm({
      message: `¿Restaurar la nómina de ${this.getMesLabel(nomina.Mes)} ${nomina.Anio}?`,
      header: 'Restaurar Nómina',
      icon: 'pi pi-refresh',
      acceptLabel: 'Sí, restaurar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.nominaService.restaurar(nomina.IdNomina).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Restaurada', detail: 'Nómina restaurada correctamente.' });
            this.loadNominasEliminadas();
            this.loadNominas();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.message });
          },
        });
      },
    });
  }

  loadEmpleados() {
    this.empleadoService.ObtenerEmplados().subscribe({
      next: (data: EmpleadoResponse[]) => this.empleados.set(data),
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar empleados',
          detail: this.handleError(err, 'No se pudieron cargar los empleados'),
        });
      },
    });
  }

  loadEstados() {
    this.estadoNominaService.getAll().subscribe({
      next: (data) => this.estados.set(data),
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar estados',
          detail: this.handleError(err, 'No se pudieron cargar los estados de nómina'),
        });
      },
    });
  }

  loadParametros() {
    this.parametroService.getAll().subscribe({
      next: (data) => this.parametros.set(data.filter(p => p.Tipo !== 'REFERENCIA')),
      error: () => {},
    });
  }

  loadCuentas() {
    this.cuentaService.getAll(true).subscribe({
      next: (data) => this.cuentas.set(data),
      error: () => this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'No se pudieron cargar las cuentas bancarias' }),
    });
  }

  private loadUserProfile() {
    const storedRole = localStorage.getItem('user_role');
    if (storedRole) {
      this.userRole.set(storedRole);
      return;
    }
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userRole.set(profile.role);
        localStorage.setItem('user_role', profile.role);
        if (profile.username) {
          localStorage.setItem('username', profile.username);
        }
      },
      error: (err) => console.warn('No se pudo cargar el perfil de usuario:', err),
    });
  }

  // ─── Helpers de visualización ─────────────────────────────────────────────

  getSalarioTotal(nomina: Nomina | null | undefined): number {
    return nomina?.NominaDetalle?.reduce((sum, d) => sum + (d.SueldoBase || 0), 0) ?? 0;
  }

  getLiquidoTotal(nomina: Nomina | null | undefined): number {
    return nomina?.NominaDetalle?.reduce((sum, d) => sum + (d.LiquidoRecibir || 0), 0) ?? 0;
  }

  getEmpleadoLabel(nomina: Nomina | undefined | null): string {
    if (!nomina?.NominaDetalle?.length) return 'N/A';
    if (nomina.NominaDetalle.length === 1) {
      const emp = nomina.NominaDetalle[0]?.Empleado;
      return `${emp?.Nombres || ''} ${emp?.Apellidos || ''}`.trim() || 'N/A';
    }
    return `${nomina.NominaDetalle.length} empleados`;
  }

  getMesLabel(mes: number): string {
    return this.meses.find((m) => m.value === mes)?.label ?? String(mes);
  }

  getEstadoNombre(nomina: Nomina): string {
    return nomina.EstadoNomina?.NombreEstado || 'Sin estado';
  }

  getEstadoSeverity(nomina: Nomina): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const color = (nomina.EstadoNomina as any)?.Color;
    if (color) return color as any;
    // Fallback si el estado no tiene Color configurado
    const nombre = nomina.EstadoNomina?.NombreEstado ?? '';
    if (nombre.includes('CANCEL')) return 'danger';
    if (nombre.includes('PAGADO') || nombre.includes('APROBADO')) return 'success';
    if (nombre.includes('PENDIENTE')) return 'warn';
    return 'info';
  }

  // ─── Sistema de firmas ────────────────────────────────────────────────────

  getFirmaCount(nomina: Nomina): number {
    return (nomina.FirmaNomina ?? []).filter((f) => f.Activo).length;
  }

  firmaPresente(nomina: Nomina | null | undefined, tipo: string): boolean {
    return (nomina?.FirmaNomina ?? []).some((f) => f.TipoFirmante === tipo && f.Activo);
  }

  puedesFirmar(nomina: Nomina): boolean {
    const estado = nomina.EstadoNomina as any;
    if (!estado || estado.EsFinal) return false;
    if (!this.isApprovalRole(this.userRole())) return false;
    return this.getFirmaCount(nomina) < 2;
  }

  getTiposFirmanteDisponibles(): { label: string; value: string }[] {
    const firmadas = this.firmasNomina().map((f) => f.TipoFirmante);
    return this.tiposFirmante.filter((t) => !firmadas.includes(t.value as any));
  }

  abrirDialogoFirma(nomina: Nomina) {
    this.nominaSeleccionada = nomina;
    this.firmaForm = { TipoFirmante: '', Comentarios: '' };
    this.firmasNomina.set(nomina.FirmaNomina ?? []);
    this.displayFirmar.set(true);
  }

  confirmarFirma() {
    if (!this.nominaSeleccionada || !this.firmaForm.TipoFirmante) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Selecciona el tipo de firma',
      });
      return;
    }

    this.nominaService
      .firmar(this.nominaSeleccionada.IdNomina, this.firmaForm.TipoFirmante, this.firmaForm.Comentarios)
      .subscribe({
        next: (result) => {
          if (result.autoAprobada) {
            this.messageService.add({
              severity: 'success',
              summary: 'Nómina Aprobada',
              detail: 'Ambas firmas completadas. La nómina fue aprobada automáticamente.',
              life: 8000,
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Firma Registrada',
              detail: `Firma de ${this.firmaForm.TipoFirmante === 'JEFE_AREA' ? 'Jefe de Área' : 'Encargado'} registrada. Falta ${result.firmasRegistradas === 1 ? '1 firma' : '0 firmas'}.`,
            });
          }
          this.displayFirmar.set(false);
          this.loadNominas();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al firmar',
            detail: this.handleError(err, 'No se pudo registrar la firma'),
          });
        },
      });
  }

  // ─── Generación de nómina ─────────────────────────────────────────────────

  showDialog() {
    this.form = {
      IdEmpleado: 0,
      SalarioBase: 0,
      Mes: new Date().getMonth() + 1,
      Anio: new Date().getFullYear(),
      IdCuenta: 0,
    };
    this.calculoPreview = null;
    this.displayDialog.set(true);
  }

  generarNomina() {
    if (!this.form.IdEmpleado || !this.form.SalarioBase) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Completa todos los campos requeridos',
      });
      return;
    }

    this.nominaService
      .generar(this.form.IdEmpleado, this.form.SalarioBase, this.form.Mes, this.form.Anio, this.form.IdCuenta || undefined)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Nómina Generada',
            detail: `Nómina de ${this.getMesLabel(this.form.Mes)}/${this.form.Anio} generada exitosamente`,
          });
          this.displayDialog.set(false);
          this.loadNominas();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al generar nómina',
            detail: this.handleError(err, 'No se pudo generar la nómina'),
          });
        },
      });
  }

  calcularPreview() {
    if (this.form.IdEmpleado && this.form.SalarioBase > 0) {
      this.nominaService.calcular(this.form.IdEmpleado, this.form.SalarioBase, this.form.Mes, this.form.Anio).subscribe({
        next: (data) => (this.calculoPreview = data),
        error: (err) => {
          this.calculoPreview = null;
          this.messageService.add({
            severity: 'error',
            summary: 'Error en cálculo',
            detail: this.handleError(err, 'No se pudo calcular la nómina'),
          });
        },
      });
    }
  }

  abrirDialogoMasiva() {
    this.formMasiva = {
      Mes: new Date().getMonth() + 1,
      Anio: new Date().getFullYear(),
      IdCuenta: 0,
    };
    this.displayMasiva.set(true);
  }

  confirmarNominaMasiva() {
    this.confirmationService.confirm({
      message: `¿Generar nómina masiva para <b>${this.getMesLabel(this.formMasiva.Mes)} ${this.formMasiva.Anio}</b> con todos los empleados activos?`,
      header: 'Confirmar Generación Masiva',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.displayMasiva.set(false);
        this.nominaService.generarMasiva(this.formMasiva.Mes, this.formMasiva.Anio, this.formMasiva.IdCuenta || undefined).subscribe({
          next: (resultado: NominaMasivaResultado) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Nómina Masiva Generada',
              detail: `Se generó nómina para ${resultado.totalEmpleados} empleados — ${this.getMesLabel(resultado.mes)} ${resultado.anio}`,
              life: 10000,
            });
            this.loadNominas();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error en generación masiva',
              detail: this.handleError(err, 'No se pudo generar la nómina masiva'),
            });
          },
        });
      },
    });
  }

  // ─── Detalle y eliminación ────────────────────────────────────────────────

  verDetalles(nomina: Nomina) {
    this.nominaSeleccionada = nomina;
    this.displayDetalles.set(true);
  }

  verParametros() {
    this.nominaService.getParametros().subscribe({
      next: (parametros) => {
        const mensaje = parametros.map((p) => `${p.nombre}: ${p.valor}`).join('\n');
        this.messageService.add({
          severity: 'info',
          summary: 'Parámetros del Sistema',
          detail: mensaje,
          life: 10000,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al obtener parámetros',
          detail: this.handleError(err, 'No se pudieron obtener los parámetros del sistema'),
        });
      },
    });
  }

  descargarReporte(nomina: Nomina, tipo: 'general' | 'igss' | 'isr') {
    const labels: Record<string, string> = {
      general: 'Planilla-General',
      igss: 'Planilla-IGSS',
      isr: 'Planilla-ISR',
    };
    const mesLabel = this.getMesLabel(nomina.Mes);
    const filename = `${labels[tipo]}-${mesLabel}-${nomina.Anio}.xlsx`;

    this.nominaService.descargarExcel(nomina.IdNomina, tipo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al descargar',
          detail: err?.message ?? 'No se pudo generar el reporte',
        });
      },
    });
  }

  deleteNomina(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de eliminar esta nómina?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.nominaService.delete(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminada',
              detail: 'Nómina eliminada',
            });
            this.loadNominas();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error al eliminar',
              detail: this.handleError(err, 'No se pudo eliminar la nómina'),
            });
          },
        });
      },
    });
  }

  // ─── Gestión de estados ───────────────────────────────────────────────────

  cambiarEstado(nomina: Nomina) {
    this.nominaSeleccionada = nomina;
    this.cambioEstadoForm = { IdEstadoNuevo: 0, NumeroBoleta: '', Comentarios: '', IdCuenta: nomina.IdCuenta ?? 0 };
    this.estadoNominaService.getEstadosDisponibles(nomina.IdNomina).subscribe({
      next: (data) => {
        this.estadosDisponibles.set(data);
        if (!data.length) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sin estados disponibles',
            detail: 'No hay estados válidos para cambiar en esta nómina.',
          });
          return;
        }
        this.displayCambiarEstado.set(true);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar estados',
          detail: this.handleError(err, 'No se pudieron cargar los estados disponibles'),
        });
      },
    });
  }

  esPagadoSeleccionado(): boolean {
    const estado = this.estadosDisponibles().find(
      (e) => e.IdEstadoNomina === this.cambioEstadoForm.IdEstadoNuevo,
    );
    // Es "pago" si es EsFinal pero no es de cancelación
    return !!(estado?.EsFinal && !estado?.EsCancelacion);
  }

  confirmarCambioEstado() {
    if (!this.nominaSeleccionada || !this.cambioEstadoForm.IdEstadoNuevo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Selecciona un estado nuevo',
      });
      return;
    }

    if (this.esPagadoSeleccionado() && !this.cambioEstadoForm.NumeroBoleta.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El número de boleta o transacción es requerido para registrar el pago',
      });
      return;
    }

    if (this.esPagadoSeleccionado() && !this.cambioEstadoForm.IdCuenta) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Selecciona la cuenta bancaria desde donde se descontará el pago',
      });
      return;
    }

    const cambioData: CambiarEstadoNominaDto = {
      IdNomina: this.nominaSeleccionada.IdNomina,
      IdEstadoNuevo: this.cambioEstadoForm.IdEstadoNuevo,
      NumeroBoleta: this.cambioEstadoForm.NumeroBoleta.trim() || undefined,
      Comentarios: this.cambioEstadoForm.Comentarios,
      IdCuenta: this.cambioEstadoForm.IdCuenta || undefined,
    };

    this.estadoNominaService.cambiarEstado(cambioData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado Cambiado',
          detail: 'El estado de la nómina se cambió exitosamente',
        });
        this.displayCambiarEstado.set(false);
        this.loadNominas();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cambiar estado',
          detail: this.handleError(err, 'No se pudo cambiar el estado de la nómina'),
        });
      },
    });
  }

  verHistorialEstados(nomina: Nomina) {
    this.estadoNominaService.getHistorial(nomina.IdNomina).subscribe({
      next: (data) => {
        this.historialEstados.set(data);
        this.nominaSeleccionada = nomina;
        this.displayHistorial.set(true);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar historial',
          detail: this.handleError(err, 'No se pudo cargar el historial de estados'),
        });
      },
    });
  }

  isCambioEstadoPermisible(nomina: Nomina): boolean {
    const estado = nomina.EstadoNomina as any;
    if (!estado) return true;
    if (estado.EsFinal) return false;
    if (estado.RequiereAprobacion) return this.isApprovalRole(this.userRole());
    return true;
  }

  // ── Nómina Personalizada ──────────────────────────────────────────────────

  abrirDialogoPersonalizada() {
    this.formPersonalizada = {
      idEmpleados:        [],
      idParametros:       [],
      Mes:                new Date().getMonth() + 1,
      Anio:               new Date().getFullYear(),
      IdCuenta:           null,
      incluirSalarioBase: true,
    };
    this.displayPersonalizada.set(true);
  }

  confirmarNominaPersonalizada() {
    if (!this.formPersonalizada.idEmpleados.length) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona al menos un empleado.' });
      return;
    }
    if (!this.formPersonalizada.idParametros.length) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona al menos un parámetro.' });
      return;
    }

    this.nominaService.generarPersonalizada(
      this.formPersonalizada.idEmpleados,
      this.formPersonalizada.idParametros,
      this.formPersonalizada.Mes,
      this.formPersonalizada.Anio,
      this.formPersonalizada.IdCuenta ?? undefined,
      this.formPersonalizada.incluirSalarioBase,
    ).subscribe({
      next: (resultado: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Nómina Personalizada Generada',
          detail: `Se generó nómina para ${resultado.totalEmpleados} empleado${resultado.totalEmpleados !== 1 ? 's' : ''} con ${resultado.parametrosAplicados} parámetro${resultado.parametrosAplicados !== 1 ? 's' : ''}.`,
          life: 8000,
        });
        this.displayPersonalizada.set(false);
        this.loadNominas();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.message });
      },
    });
  }

  getParametroLabel(p: ParametroGlobal): string {
    const unidad = p.Unidad === '%' ? `${p.Valor}%` : `Q ${p.Valor}`;
    return `${p.NombreParametro} (${unidad})`;
  }

  getParametrosSelecionados(): ParametroGlobal[] {
    return this.parametros().filter(p => this.formPersonalizada.idParametros.includes(p.IdParametro));
  }

  getEmpleadosSeleccionados(): EmpleadoResponse[] {
    return this.empleados().filter(e => this.formPersonalizada.idEmpleados.includes(e.IdEmpleado));
  }

  enviarBoleta(nomina: Nomina) {
    this.confirmationService.confirm({
      message: `¿Enviar la boleta de pago de ${this.getMesLabel(nomina.Mes)} ${nomina.Anio} por correo a los empleados?`,
      header: 'Enviar Boleta',
      icon: 'pi pi-envelope',
      acceptLabel: 'Sí, enviar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.enviandoCorreo.set(nomina.IdNomina);
        this.correoService.enviarBoletaNomina(nomina.IdNomina).subscribe({
          next: (res) => {
            this.enviandoCorreo.set(null);
            this.messageService.add({
              severity: 'success',
              summary: 'Correos enviados',
              detail: `Boleta enviada a ${res.enviados} empleado${res.enviados !== 1 ? 's' : ''}.`,
              life: 6000,
            });
          },
          error: (err) => {
            this.enviandoCorreo.set(null);
            this.messageService.add({ severity: 'error', summary: 'Error al enviar', detail: err?.message });
          },
        });
      },
    });
  }

  private isApprovalRole(role: string | null): boolean {
    if (!role) return false;
    const r = role.trim().toUpperCase().replace(/\s+/g, '_');
    return ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS_HUMANOS', 'RECURSOS HUMANOS'].includes(r);
  }
}
