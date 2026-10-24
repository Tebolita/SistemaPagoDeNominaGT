import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MovimientoFinancieroService } from '../../services/movimiento-financiero.service';
import { CuentaBancariaEmpresaService } from '../../services/cuenta-bancaria-empresa.service';
import { MovimientoFinanciero } from '../../models/MovimientoFinanciero.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-movimiento-financiero',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    TagModule,
    ToastModule,
    CardModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './movimiento-financiero.html',
  styleUrl: './movimiento-financiero.css'
})
export class MovimientoFinancieroComponent implements OnInit {
  movimientos: MovimientoFinanciero[] = [];
  // Paginación en el servidor
  totalMovimientos = 0;
  filasPorPagina = 10;
  paginaActual = 1;
  primerRegistro = 0;
  cuentas: any[] = [];
  movimientoForm: Partial<MovimientoFinanciero> = {};
  movimientoDialog = false;
  idMovimientoEditando: number | null = null;  // null = registrar uno nuevo
  loading = false;
  savingMovimiento = false;
  deletingMovimiento = false;

  tiposMovimiento = [
    { label: 'Ingreso', value: 'INGRESO' },
    { label: 'Egreso', value: 'EGRESO' }
  ];

  categorias = [
    { label: 'Venta', value: 'VENTA' },
    { label: 'Nómina', value: 'NOMINA' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Depósito', value: 'DEPOSITO' },
    { label: 'Retiro', value: 'RETIRO' },
    { label: 'Comisión', value: 'COMISION' },
    { label: 'Interés', value: 'INTERES' },
    { label: 'Otro', value: 'OTRO' }
  ];

  filtroTipo = '';
  filtroCuenta: number | null = null;

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private movimientoService = inject(MovimientoFinancieroService);
  private cuentaService = inject(CuentaBancariaEmpresaService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    // La primera página la pide la tabla (onLazyLoad) al iniciarse
    this.loadCuentas();
  }

  loadCuentas() {
    this.cuentaService.getAll().subscribe({
      next: (data: any[]) => {
        this.cuentas = data;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.cdr.markForCheck();
      }
    });
  }

  // Carga la página actual con los filtros seleccionados
  loadMovimientos() {
    this.loading = true;
    this.movimientoService
      .getPaginado(this.paginaActual, this.filasPorPagina, this.filtroCuenta ?? undefined, this.filtroTipo || undefined)
      .subscribe({
        next: (data) => {
          this.movimientos = data.registros;
          this.totalMovimientos = data.total;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          this.cdr.markForCheck();
        }
      });
  }

  onLazyLoad(event: TableLazyLoadEvent) {
    this.filasPorPagina = event.rows ?? this.filasPorPagina;
    this.primerRegistro = event.first ?? 0;
    this.paginaActual = Math.floor(this.primerRegistro / this.filasPorPagina) + 1;
    this.loadMovimientos();
  }

  // Un filtro nuevo vuelve a la primera página
  filtrar() {
    this.paginaActual = 1;
    this.primerRegistro = 0;
    this.loadMovimientos();
  }

  openNew() {
    this.idMovimientoEditando = null;
    this.movimientoForm = {
      TipoMovimiento: 'INGRESO',
      Activo: true,
      FechaMovimiento: new Date().toISOString().split('T')[0],
      // Usuario autenticado (guardado al iniciar sesión)
      IdUsuarioRegistra: Number(localStorage.getItem('id_usuario')) || undefined,
    };
    this.movimientoDialog = true;
  }

  // Los movimientos generados por una venta o una nómina se editan desde su módulo
  esEditable(m: MovimientoFinanciero): boolean {
    return !m.IdVenta && !m.IdNomina;
  }

  editMovimiento(m: MovimientoFinanciero) {
    this.idMovimientoEditando = m.IdMovimiento;
    this.movimientoForm = {
      IdCuenta: m.IdCuenta,
      TipoMovimiento: m.TipoMovimiento,
      Categoria: m.Categoria,
      Subcategoria: m.Subcategoria,
      Referencia: m.Referencia,
      Monto: Number(m.Monto),
      FechaMovimiento: m.FechaMovimiento,
      Notas: m.Notas,
    };
    this.movimientoDialog = true;
  }

  saveMovimiento() {
    if (!this.movimientoForm.IdCuenta || !this.movimientoForm.Categoria || this.movimientoForm.Monto == null) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Cuenta, categoría y monto son obligatorios.' });
      return;
    }

    if (this.savingMovimiento) return;

    this.savingMovimiento = true;
    const editando = this.idMovimientoEditando;
    const peticion = editando
      ? this.movimientoService.update(editando, this.movimientoForm)
      : this.movimientoService.create(this.movimientoForm);

    peticion.pipe(finalize(() => this.savingMovimiento = false)).subscribe({
      next: () => {
        this.movimientoDialog = false;
        this.movimientoForm = {};
        this.idMovimientoEditando = null;
        const detalle = editando
          ? 'Movimiento actualizado y saldo reajustado.'
          : 'Movimiento registrado correctamente.';
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: detalle });
        this.loadMovimientos();
        this.loadCuentas();  // refrescar los saldos mostrados
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  deleteMovimiento(movimiento: MovimientoFinanciero) {
    if (!movimiento.IdMovimiento) return;

    this.confirmationService.confirm({
      message: `¿Eliminar este movimiento de ${movimiento.TipoMovimiento === 'INGRESO' ? 'ingreso' : 'egreso'} por Q ${Number(movimiento.Monto).toFixed(2)}? El saldo de la cuenta se ajustará automáticamente.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deletingMovimiento = true;
        this.movimientoService.delete(movimiento.IdMovimiento).pipe(
          finalize(() => { this.deletingMovimiento = false; this.cdr.detectChanges(); })
        ).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Movimiento eliminado y saldo actualizado.' });
            this.loadMovimientos();
            this.loadCuentas();
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
        });
      }
    });
  }

  hideDialog() {
    this.movimientoDialog = false;
  }

  getColorPorTipo(tipo: string): 'success' | 'danger' {
    return tipo === 'INGRESO' ? 'success' : 'danger';
  }

  getNombreCuenta(idCuenta: number): string {
    return this.cuentas.find(c => c.IdCuenta === idCuenta)?.NombreCuenta ?? 'N/A';
  }
}
