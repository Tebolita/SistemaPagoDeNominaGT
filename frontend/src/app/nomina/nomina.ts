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
import { Nomina, NominaCalculo, NominaMasivaResultado } from '../models/Nomina.model';
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
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  nominas = signal<Nomina[]>([]);
  empleados = signal<EmpleadoResponse[]>([]);
  estados = signal<EstadoNomina[]>([]);
  historialEstados = signal<HistorialEstadoNomina[]>([]);

  displayDialog = signal(false);
  displayDetalles = signal(false);
  displayCambiarEstado = signal(false);
  displayHistorial = signal(false);
  form = { IdEmpleado: 0, SalarioBase: 0 };
  cambioEstadoForm = { IdEstadoNuevo: 0, Comentarios: '' };
  calculoPreview: NominaCalculo | null = null;
  nominaSeleccionada: Nomina | null = null;

  ngOnInit() {
    this.loadNominas();
    this.loadEmpleados();
    this.loadEstados();
  }

  private handleError(error: any, defaultMessage: string = 'Ha ocurrido un error inesperado'): string {
    console.error('Error en nómina:', error);

    // El error ya viene procesado por error.service.ts
    if (error?.message) {
      return error.message;
    }

    // Mensaje por defecto
    return defaultMessage;
  }

  loadNominas() {
    this.nominaService.getAll().subscribe({
      next: (data) => this.nominas.set(data),
      error: (err) => {
        const errorMessage = this.handleError(err, 'No se pudieron cargar las nóminas');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar nóminas',
          detail: errorMessage,
        });
      },
    });
  }

  getSalarioTotal(nomina: Nomina | null | undefined): number {
    return nomina?.NominaDetalle?.reduce((sum, detalle) => sum + (detalle.SueldoBase || 0), 0) ?? 0;
  }

  getLiquidoTotal(nomina: Nomina | null | undefined): number {
    return nomina?.NominaDetalle?.reduce((sum, detalle) => sum + (detalle.LiquidoRecibir || 0), 0) ?? 0;
  }

  getEmpleadoLabel(nomina: Nomina | undefined | null): string {
    if (!nomina?.NominaDetalle || nomina.NominaDetalle.length === 0) {
      return 'N/A';
    }
    if (nomina.NominaDetalle.length === 1) {
      const empleado = nomina.NominaDetalle[0]?.Empleado;
      return `${empleado?.Nombres || ''} ${empleado?.Apellidos || ''}`.trim() || 'N/A';
    }
    return `${nomina.NominaDetalle.length} empleados`;
  }

  loadEmpleados() {
    this.empleadoService.ObtenerEmplados().subscribe({
      next: (data: EmpleadoResponse[]) => {
        console.log('Empleados cargados:', data);
        this.empleados.set(data);
      },
      error: (err) => {
        console.error('Error cargando empleados:', err);
        const errorMessage = this.handleError(err, 'No se pudieron cargar los empleados');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar empleados',
          detail: errorMessage
        });
      },
    });
  }

  loadEstados() {
    this.estadoNominaService.getAll().subscribe({
      next: (data) => this.estados.set(data),
      error: (err) => {
        const errorMessage = this.handleError(err, 'No se pudieron cargar los estados de nómina');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar estados',
          detail: errorMessage,
        });
      },
    });
  }

  showDialog() {
    this.displayDialog.set(true);
    this.form = { IdEmpleado: 0, SalarioBase: 0 };
    this.calculoPreview = null;
  }

  generarNomina() {
    if (!this.form.IdEmpleado || !this.form.SalarioBase) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Completa todos los campos',
      });
      return;
    }

    this.nominaService
      .generar(this.form.IdEmpleado, this.form.SalarioBase)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Generada',
            detail: 'Nómina generada exitosamente',
          });
          this.displayDialog.set(false);
          this.loadNominas();
        },
        error: (err) => {
          const errorMessage = this.handleError(err, 'No se pudo generar la nómina');
          this.messageService.add({
            severity: 'error',
            summary: 'Error al generar nómina',
            detail: errorMessage,
          });
        },
      });
  }

  calcularPreview() {
    if (this.form.IdEmpleado && this.form.SalarioBase > 0) {
      this.nominaService
        .calcular(this.form.IdEmpleado, this.form.SalarioBase)
        .subscribe({
          next: (data) => (this.calculoPreview = data),
          error: (err) => {
            this.calculoPreview = null;
            const errorMessage = this.handleError(err, 'No se pudo calcular la nómina');
            this.messageService.add({
              severity: 'error',
              summary: 'Error en cálculo',
              detail: errorMessage,
            });
          },
        });
    }
  }

  verDetalles(nomina: Nomina) {
    this.nominaSeleccionada = nomina;
    this.displayDetalles.set(true);
  }

  verParametros() {
    this.nominaService.getParametros().subscribe({
      next: (parametros) => {
        console.log('Parámetros del sistema:', parametros);
        const mensaje = parametros.map(p => `${p.nombre}: ${p.valor} (${p.tipo})`).join('\n');
        this.messageService.add({
          severity: 'info',
          summary: 'Parámetros del Sistema',
          detail: mensaje,
          life: 10000
        });
      },
      error: (err) => {
        console.error('Error obteniendo parámetros:', err);
        const errorMessage = this.handleError(err, 'No se pudieron obtener los parámetros del sistema');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al obtener parámetros',
          detail: errorMessage
        });
      }
    });
  }

  generarNominaMasiva() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de generar la nómina masiva para todos los empleados activos?',
      header: 'Confirmar Generación Masiva',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.nominaService.generarMasiva().subscribe({
          next: (resultado: NominaMasivaResultado) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Nómina Masiva Generada',
              detail: `Se generó nómina para ${resultado.totalEmpleados} empleados del mes ${resultado.mes}/${resultado.anio}`,
              life: 10000
            });
            this.loadNominas();
          },
          error: (err) => {
            console.error('Error generando nómina masiva:', err);
            const errorMessage = this.handleError(err, 'No se pudo generar la nómina masiva');
            this.messageService.add({
              severity: 'error',
              summary: 'Error en generación masiva',
              detail: errorMessage
            });
          }
        });
      },
    });
  }

  deleteNomina(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro?',
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
            const errorMessage = this.handleError(err, 'No se pudo eliminar la nómina');
            this.messageService.add({
              severity: 'error',
              summary: 'Error al eliminar',
              detail: errorMessage,
            });
          },
        });
      },
    });
  }

  // Métodos para gestión de estados
  cambiarEstado(nomina: Nomina) {
    this.nominaSeleccionada = nomina;
    this.cambioEstadoForm = { IdEstadoNuevo: 0, Comentarios: '' };
    this.displayCambiarEstado.set(true);
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
        const errorMessage = this.handleError(err, 'No se pudo cambiar el estado de la nómina');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cambiar estado',
          detail: errorMessage,
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
        const errorMessage = this.handleError(err, 'No se pudo cargar el historial de estados');
        this.messageService.add({
          severity: 'error',
          summary: 'Error al cargar historial',
          detail: errorMessage,
        });
      },
    });
  }

  getEstadoNombre(nomina: Nomina): string {
    return nomina.EstadoNomina?.NombreEstado || 'Sin estado';
  }

  getEstadoSeverity(nomina: Nomina): 'success' | 'info' | 'warn' | 'danger' {
    const estado = nomina.EstadoNomina?.NombreEstado;
    switch (estado) {
      case 'GENERADA': return 'info';
      case 'PENDIENTE_APROBACION': return 'warn';
      case 'APROBADA': return 'success';
      case 'RECHAZADA': return 'danger';
      case 'PROCESADA': return 'success';
      default: return 'info';
    }
  }
}
