import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
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
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { VentaService } from '../services/venta.service';
import { ClienteService } from '../services/cliente.service';
import { ProductoServicioService } from '../services/producto-servicio.service';

@Component({
  selector: 'app-venta',
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
    CardModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './venta.html',
  styleUrl: './venta.css'
})
export class VentaComponent implements OnInit {
  ventas: any[] = [];
  clientes: any[] = [];
  productos: any[] = [];
  selectedSale: any = null;

  saleDialog = false;
  detallesDialog = false;
  loading = false;

  statusFilter = '';
  clienteFilter: number | null = null;

  tiposVenta = [
    { label: 'Contado', value: 'CONTADO' },
    { label: 'Crédito', value: 'CREDITO' }
  ];

  estadosPago = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagado', value: 'PAGADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
    { label: 'Vencido', value: 'VENCIDO' }
  ];

  newSale: any = {
    IdCliente: null,
    FechaVenta: new Date().toISOString().split('T')[0],
    TipoVenta: 'CONTADO',
    Descuento: 0,
    EstadoPago: 'PENDIENTE',
    FechaVencimiento: new Date().toISOString().split('T')[0],
    Notas: '',
    Detalles: [],
  };

  detalleForm: any = {
    IdProducto: null,
    Cantidad: 1,
    PrecioUnitario: 0,
    Descuento: 0,
  };

  private messageService = inject(MessageService);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoServicioService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadClientes();
    this.loadProductos();
    this.loadVentas();
  }

  loadClientes() {
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.cdr.markForCheck();
      }
    });
  }

  loadProductos() {
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.cdr.markForCheck();
      }
    });
  }

  loadVentas() {
    this.loading = true;
    this.ventaService.getAll(this.statusFilter, this.clienteFilter ?? undefined).subscribe({
      next: (data) => {
        this.ventas = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.cdr.markForCheck();
      }
    });
  }

  openNewSale() {
    this.saleDialog = true;
    this.newSale = {
      IdCliente: null,
      FechaVenta: new Date().toISOString().split('T')[0],
      TipoVenta: 'CONTADO',
      Descuento: 0,
      EstadoPago: 'PENDIENTE',
      FechaVencimiento: new Date().toISOString().split('T')[0],
      Notas: '',
      Detalles: [],
    };
    this.detalleForm = {
      IdProducto: null,
      Cantidad: 1,
      PrecioUnitario: 0,
      Descuento: 0,
    };
  }

  addDetalle() {
    if (!this.detalleForm.IdProducto || this.detalleForm.Cantidad <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione un producto y cargue una cantidad válida.' });
      return;
    }

    const producto = this.productos.find((item) => item.IdProducto === this.detalleForm.IdProducto);
    if (!producto) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Producto no encontrado.' });
      return;
    }

    const detalle = {
      IdProducto: this.detalleForm.IdProducto,
      Cantidad: this.detalleForm.Cantidad,
      PrecioUnitario: producto.PrecioUnitario,
      Descuento: this.detalleForm.Descuento || 0,
    };

    this.newSale.Detalles.push(detalle);
    this.detalleForm = {
      IdProducto: null,
      Cantidad: 1,
      PrecioUnitario: 0,
      Descuento: 0,
    };
  }

  removeDetalle(index: number) {
    this.newSale.Detalles.splice(index, 1);
  }

  updateDetallePrice() {
    const producto = this.productos.find((item) => item.IdProducto === this.detalleForm.IdProducto);
    if (producto) {
      this.detalleForm.PrecioUnitario = producto.PrecioUnitario;
    }
  }

  openSaleDetails(venta: any) {
    this.selectedSale = venta;
    this.detallesDialog = true;
  }

  saveSale() {
    if (!this.newSale.IdCliente) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Seleccione un cliente para la venta.' });
      return;
    }

    if (!this.newSale.Detalles.length) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Agregue al menos un detalle de venta.' });
      return;
    }

    this.ventaService.create(this.newSale).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Venta creada correctamente.' });
        this.saleDialog = false;
        this.loadVentas();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  markAsPaid(venta: any) {
    this.ventaService.updateEstadoPago(venta.IdVenta, 'PAGADO').subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado de pago actualizado a PAGADO.' });
        this.loadVentas();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  getSaleTotal(venta: any): number {
    return venta?.Total ?? 0;
  }

  getDetailSubtotal(detalle: any): number {
    return (detalle.Cantidad * detalle.PrecioUnitario) - (detalle.Descuento ?? 0);
  }

  getSaleSubtotal(): number {
    return this.newSale.Detalles.reduce((sum: number, detalle: any) => {
      return sum + this.getDetailSubtotal(detalle);
    }, 0);
  }

  getSaleTax(): number {
    const subtotal = this.getSaleSubtotal();
    const descuento = this.newSale.Descuento || 0;
    const taxableAmount = subtotal - descuento;
    return taxableAmount > 0 ? taxableAmount * 0.12 : 0;
  }

  calculateInvoiceTotal(): number {
    const subtotal = this.getSaleSubtotal();
    const descuento = this.newSale.Descuento || 0;
    const subtotalConDescuento = subtotal - descuento;
    const impuestos = subtotalConDescuento > 0 ? subtotalConDescuento * 0.12 : 0;
    return subtotalConDescuento + impuestos;
  }
}
