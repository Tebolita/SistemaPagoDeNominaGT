import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
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

  nominas = signal<Nomina[]>([]);
  empleados = signal<EmpleadoResponse[]>([]);
  estados = signal<EstadoNomina[]>([]);
  estadosDisponibles = signal<EstadoNomina[]>([]);
  historialEstados = signal<HistorialEstadoNomina[]>([]);
  firmasNomina = signal<FirmaNomina[]>([]);
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
  };

  formMasiva = {
    Mes: new Date().getMonth() + 1,
    Anio: new Date().getFullYear(),
  };

  firmaForm = { TipoFirmante: '', Comentarios: '' };
  cambioEstadoForm = { IdEstadoNuevo: 0, Comentarios: '' };
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

  getEstadoSeverity(nomina: Nomina): 'success' | 'info' | 'warn' | 'danger' {
    switch (nomina.EstadoNomina?.NombreEstado) {
      case 'GENERADA': return 'info';
      case 'PENDIENTE_APROBACION': return 'warn';
      case 'APROBADA': return 'success';
      case 'RECHAZADA': return 'danger';
      case 'PROCESADA': return 'success';
      default: return 'info';
    }
  }

  // ─── Sistema de firmas ────────────────────────────────────────────────────

  getFirmaCount(nomina: Nomina): number {
    return (nomina.FirmaNomina ?? []).filter((f) => f.Activo).length;
  }

  firmaPresente(nomina: Nomina, tipo: string): boolean {
    return (nomina.FirmaNomina ?? []).some((f) => f.TipoFirmante === tipo && f.Activo);
  }

  puedesFirmar(nomina: Nomina): boolean {
    if (nomina.EstadoNomina?.NombreEstado !== 'PENDIENTE_APROBACION') return false;
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
      .generar(this.form.IdEmpleado, this.form.SalarioBase, this.form.Mes, this.form.Anio)
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
      this.nominaService.calcular(this.form.IdEmpleado, this.form.SalarioBase).subscribe({
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
        this.nominaService.generarMasiva(this.formMasiva.Mes, this.formMasiva.Anio).subscribe({
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
    this.cambioEstadoForm = { IdEstadoNuevo: 0, Comentarios: '' };
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

  confirmarCambioEstado() {
    if (!this.nominaSeleccionada || !this.cambioEstadoForm.IdEstadoNuevo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Selecciona un estado nuevo',
      });
      return;
    }

    const cambioData: CambiarEstadoNominaDto = {
      IdNomina: this.nominaSeleccionada.IdNomina,
      IdEstadoNuevo: this.cambioEstadoForm.IdEstadoNuevo,
      Comentarios: this.cambioEstadoForm.Comentarios,
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
    const nombre = nomina.EstadoNomina?.NombreEstado;
    if (!nombre) return true;
    if (nombre === 'PROCESADA') return false;
    if (nombre === 'PENDIENTE_APROBACION') return this.isApprovalRole(this.userRole());
    return true;
  }

  private isApprovalRole(role: string | null): boolean {
    if (!role) return false;
    const r = role.trim().toUpperCase().replace(/\s+/g, '_');
    return ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'RRHH', 'RECURSOS_HUMANOS', 'RECURSOS HUMANOS'].includes(r);
  }
}
