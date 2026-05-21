import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ProductoServicioService } from '../services/producto-servicio.service';
import { ProductoServicio } from '../models/ProductoServicio.model';

@Component({
  selector: 'app-producto-servicio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    ToastModule,
    SelectModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './producto-servicio.html',
  styleUrl: './producto-servicio.css'
})
export class ProductoServicioComponent implements OnInit {
  productos: ProductoServicio[] = [];
  productoForm: Partial<ProductoServicio> = {};
  productoDialog = false;
  isEdit = false;
  loading = false;

  tiposProducto = [
    { label: 'Producto', value: 'PRODUCTO' },
    { label: 'Servicio', value: 'SERVICIO' }
  ];

  private messageService = inject(MessageService);
  private productoService = inject(ProductoServicioService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadProductos();
  }

  loadProductos() {
    this.loading = true;
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.productos = data;
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

  openNew() {
    this.productoForm = { Activo: true };
    this.isEdit = false;
    this.productoDialog = true;
  }

  editProducto(producto: ProductoServicio) {
    this.productoForm = { ...producto };
    this.isEdit = true;
    this.productoDialog = true;
  }

  saveProducto() {
    if (!this.productoForm.NombreProducto || this.productoForm.PrecioUnitario === undefined) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'El nombre y el precio unitario son obligatorios.' });
      return;
    }

    const operation = this.isEdit && this.productoForm.IdProducto
      ? this.productoService.update(this.productoForm.IdProducto, this.productoForm)
      : this.productoService.create(this.productoForm);

    operation.subscribe({
      next: () => {
        this.productoDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Producto/Servicio ${this.isEdit ? 'actualizado' : 'creado'} correctamente.` });
        this.loadProductos();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  deleteProducto(producto: ProductoServicio) {
    if (!producto.IdProducto) {
      return;
    }

    this.productoService.delete(producto.IdProducto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Producto/Servicio eliminado correctamente.' });
        this.loadProductos();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  hideDialog() {
    this.productoDialog = false;
  }
}
