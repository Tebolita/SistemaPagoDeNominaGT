import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { finalize } from 'rxjs';

import { VentaService } from '../services/venta.service';
import { ClienteService } from '../services/cliente.service';
import { ProductoServicioService } from '../services/producto-servicio.service';
import { CuentaBancariaEmpresaService } from '../services/cuenta-bancaria-empresa.service';
import { CorreoService } from '../services/correo.service';
import { Venta } from '../models/Venta.model';
import { CuentaBancariaEmpresa } from '../models/CuentaBancariaEmpresa.model';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, SelectModule, DatePickerModule,
    TextareaModule, TagModule, ToastModule, TooltipModule, ConfirmDialogModule, DividerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './venta.html',
  styleUrl: './venta.css',
})
export class VentaComponent implements OnInit {
  ventas: Venta[] = [];
  clientes: any[] = [];
  productos: any[] = [];
  cuentas: CuentaBancariaEmpresa[] = [];
  selectedVenta: Venta | null = null;

  saleDialog = false;
  detallesDialog = false;
  pagoDialog = false;
  loading = false;

  statusFilter = '';
  clienteFilter: number | null = null;

  tiposVenta    = [{ label: 'Contado', value: 'CONTADO' }, { label: 'Crédito', value: 'CREDITO' }];
  estadosPago   = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagado',    value: 'PAGADO'    },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Vencido',   value: 'VENCIDO'   },
  ];

  newSale: any = this.emptyForm();
  detalleForm: any = this.emptyDetalle();
  pagoForm: { IdCuenta: number | null } = { IdCuenta: null };

  private messageService     = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private ventaService       = inject(VentaService);
  private clienteService     = inject(ClienteService);
  private productoService    = inject(ProductoServicioService);
  private cuentaService      = inject(CuentaBancariaEmpresaService);
  private correoService      = inject(CorreoService);
  private cdr                = inject(ChangeDetectorRef);
  enviandoCorreo: number | null = null;

  ngOnInit() {
    this.loadClientes();
    this.loadProductos();
    this.loadCuentas();
    this.loadVentas();
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  loadClientes() {
    this.clienteService.getAll().subscribe({
      next: (d) => { this.clientes = d; this.cdr.markForCheck(); },
      error: (e) => this.showError(e),
    });
  }

  loadProductos() {
    this.productoService.getAll().subscribe({
      next: (d) => { this.productos = d; this.cdr.markForCheck(); },
      error: (e) => this.showError(e),
    });
  }

  loadCuentas() {
    this.cuentaService.getAll(true).subscribe({
      next: (d) => { this.cuentas = d; this.cdr.markForCheck(); },
      error: () => {},
    });
  }

  loadVentas() {
    this.loading = true;
    this.ventaService.getAll(this.statusFilter || undefined, this.clienteFilter ?? undefined).subscribe({
      next: (d) => { this.ventas = d; this.loading = false; this.cdr.markForCheck(); },
      error: (e) => { this.loading = false; this.showError(e); },
    });
  }

  // ── Diálogos ──────────────────────────────────────────────────────────────

  openNewSale() {
    this.newSale = this.emptyForm();
    this.detalleForm = this.emptyDetalle();
    this.saleDialog = true;
  }

  openDetalles(venta: Venta) {
    this.selectedVenta = venta;
    this.detallesDialog = true;
  }

  // ── Gestión de detalles ───────────────────────────────────────────────────

  addDetalle() {
    if (!this.detalleForm.IdProducto || this.detalleForm.Cantidad <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona un producto y una cantidad válida.' });
      return;
    }
    const producto = this.productos.find(p => p.IdProducto === this.detalleForm.IdProducto);
    if (!producto) return;

    const precio = parseFloat(String(producto.PrecioUnitario));
    if (!precio || precio <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El producto no tiene precio configurado.' });
      return;
    }

    this.newSale.Detalles.push({
      IdProducto: this.detalleForm.IdProducto,
      Cantidad: Number(this.detalleForm.Cantidad),
      PrecioUnitario: precio,
      Descuento: parseFloat(String(this.detalleForm.Descuento || 0)),
      _nombre: producto.NombreProducto,
    });
    this.detalleForm = this.emptyDetalle();
  }

  removeDetalle(index: number) {
    this.newSale.Detalles.splice(index, 1);
  }

  onProductoSelect() {
    const producto = this.productos.find(p => p.IdProducto === this.detalleForm.IdProducto);
    if (producto) this.detalleForm.PrecioUnitario = producto.PrecioUnitario;
  }

  // ── Guardar venta ─────────────────────────────────────────────────────────

  saveSale() {
    if (!this.newSale.IdCliente) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona un cliente.' });
      return;
    }
    if (!this.newSale.Detalles.length) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Agrega al menos un producto.' });
      return;
    }
    if (this.newSale.EstadoPago === 'PAGADO' && !this.newSale.IdCuenta) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona la cuenta bancaria para registrar el cobro.' });
      return;
    }

    const payload: any = {
      ...this.newSale,
      Detalles: this.newSale.Detalles.map((d: any) => ({
        IdProducto: d.IdProducto,
        Cantidad: d.Cantidad,
        PrecioUnitario: d.PrecioUnitario,
        Descuento: d.Descuento,
      })),
    };
    if (!payload.IdCuenta) delete payload.IdCuenta;
    if (!payload.IdCliente) delete payload.IdCliente;
    if (!payload.FechaVencimiento) delete payload.FechaVencimiento;

    this.ventaService.create(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Venta creada correctamente.' });
        this.saleDialog = false;
        this.loadVentas();
      },
      error: (e) => this.showError(e),
    });
  }

  // ── Cambio de estado ──────────────────────────────────────────────────────

  abrirPago(venta: Venta) {
    this.selectedVenta = venta;
    this.pagoForm = { IdCuenta: venta.IdCuenta ?? null };
    this.pagoDialog = true;
  }

  confirmarPago() {
    if (!this.selectedVenta) return;
    if (!this.pagoForm.IdCuenta) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Selecciona la cuenta bancaria donde se acreditará el cobro.' });
      return;
    }

    this.ventaService.updateEstadoPago(this.selectedVenta.IdVenta, 'PAGADO', this.pagoForm.IdCuenta).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Cobro registrado', detail: 'Venta marcada como pagada y saldo actualizado.' });
        this.pagoDialog = false;
        this.loadVentas();
      },
      error: (e) => this.showError(e),
    });
  }

  cancelarVenta(venta: Venta) {
    const esPagada = venta.EstadoPago === 'PAGADO';
    this.confirmationService.confirm({
      message: esPagada
        ? `¿Cancelar la venta #${venta.IdVenta}? El cobro registrado se revertirá y el saldo de la cuenta se ajustará.`
        : `¿Cancelar la venta #${venta.IdVenta}?`,
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ventaService.updateEstadoPago(venta.IdVenta, 'CANCELADO').subscribe({
          next: () => {
            this.messageService.add({ severity: 'info', summary: 'Cancelada', detail: 'Venta cancelada' + (esPagada ? ' y cobro revertido.' : '.') });
            this.loadVentas();
          },
          error: (e) => this.showError(e),
        });
      },
    });
  }

  eliminarVenta(venta: Venta) {
    this.confirmationService.confirm({
      message: `¿Eliminar definitivamente la venta #${venta.IdVenta}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ventaService.delete(venta.IdVenta).pipe(finalize(() => this.cdr.detectChanges())).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'Venta eliminada.' });
            this.loadVentas();
          },
          error: (e) => this.showError(e),
        });
      },
    });
  }

  // ── Envío de factura por correo ───────────────────────────────────────────

  enviarFactura(venta: Venta) {
    if (!venta.Cliente?.Correo) {
      this.messageService.add({ severity: 'warn', summary: 'Sin correo', detail: 'El cliente no tiene correo electrónico registrado.' });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Enviar la factura #${venta.IdVenta} al correo de ${venta.Cliente.NombreCliente}?`,
      header: 'Enviar Factura',
      icon: 'pi pi-envelope',
      acceptLabel: 'Sí, enviar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.enviandoCorreo = venta.IdVenta;
        this.correoService.enviarFacturaVenta(venta.IdVenta).subscribe({
          next: (res) => {
            this.enviandoCorreo = null;
            this.messageService.add({
              severity: 'success',
              summary: 'Factura enviada',
              detail: `Correo enviado a ${res.destinatario}`,
              life: 6000,
            });
          },
          error: (err) => {
            this.enviandoCorreo = null;
            this.messageService.add({ severity: 'error', summary: 'Error al enviar', detail: err?.message });
          },
        });
      },
    });
  }

  // ── Helpers visuales ──────────────────────────────────────────────────────

  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'PAGADO':    return 'success';
      case 'PENDIENTE': return 'warn';
      case 'CANCELADO': return 'danger';
      case 'VENCIDO':   return 'secondary';
      default:          return 'info';
    }
  }

  getSubtotalDetalle(d: any): number {
    return (d.Cantidad * d.PrecioUnitario) - (d.Descuento ?? 0);
  }

  get subtotalForm(): number {
    return this.newSale.Detalles.reduce((s: number, d: any) => s + this.getSubtotalDetalle(d), 0);
  }

  get impuestosForm(): number {
    const base = this.subtotalForm - (this.newSale.Descuento || 0);
    return base > 0 ? base * 0.12 : 0;
  }

  get totalForm(): number {
    const base = this.subtotalForm - (this.newSale.Descuento || 0);
    return base > 0 ? base * 1.12 : 0;
  }

  getNombreProducto(idProducto: number): string {
    return this.productos.find(p => p.IdProducto === idProducto)?.NombreProducto ?? '—';
  }

  private emptyForm() {
    return {
      IdCliente: null, IdCuenta: null,
      FechaVenta: new Date().toISOString().split('T')[0],
      TipoVenta: 'CONTADO', Descuento: 0,
      EstadoPago: 'PENDIENTE',
      FechaVencimiento: null, Notas: '', Detalles: [],
    };
  }

  private emptyDetalle() {
    return { IdProducto: null, Cantidad: 1, PrecioUnitario: 0, Descuento: 0 };
  }

  private showError(e: any) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.message ?? 'Error inesperado' });
  }
}
