import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CuentaBancariaEmpresaService } from '../../services/cuenta-bancaria-empresa.service';
import { BancoService } from '../../services/banco.service';
import { CuentaBancariaEmpresa } from '../../models/CuentaBancariaEmpresa.model';

@Component({
  selector: 'app-cuenta-bancaria',
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
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './cuenta-bancaria.html',
  styleUrl: './cuenta-bancaria.css'
})
export class CuentaBancariaComponent implements OnInit {
  cuentas: CuentaBancariaEmpresa[] = [];
  bancos: any[] = [];
  cuentaForm: Partial<CuentaBancariaEmpresa> = {};
  cuentaDialog = false;
  isEdit = false;
  loading = false;
  savingCuenta = false;
  deletingCuenta = false;

  tiposCuenta = [
    { label: 'Corriente', value: 'CORRIENTE' },
    { label: 'Ahorros', value: 'AHORROS' },
    { label: 'Moneda Extranjera', value: 'MONEDA_EXTRANJERA' }
  ];

  monedas = [
    { label: 'Quetzal (Q)', value: 'GTQ' },
    { label: 'Dólar (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' }
  ];

  private messageService = inject(MessageService);
  private cuentaService = inject(CuentaBancariaEmpresaService);
  private bancoService = inject(BancoService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadBancos();
    this.loadCuentas();
  }

  loadBancos() {
    this.bancoService.getAll().subscribe({
      next: (data: any[]) => {
        this.bancos = data;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.cdr.markForCheck();
      }
    });
  }

  loadCuentas() {
    this.loading = true;
    this.cuentaService.getAll().subscribe({
      next: (data: CuentaBancariaEmpresa[]) => {
        this.cuentas = data;
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

  openNew() {
    this.cuentaForm = { Activo: true, Moneda: 'GTQ' };
    this.isEdit = false;
    this.cuentaDialog = true;
  }

  editCuenta(cuenta: CuentaBancariaEmpresa) {
    this.cuentaForm = { ...cuenta };
    this.isEdit = true;
    this.cuentaDialog = true;
  }

  saveCuenta() {
    if (!this.cuentaForm.IdBanco || !this.cuentaForm.NumeroCuenta || !this.cuentaForm.NombreCuenta) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Banco, número de cuenta y nombre son obligatorios.' });
      return;
    }

    if (this.isEdit && this.cuentaForm.IdCuenta) {
      // Para actualización, excluir IdCuenta y Banco del data
      const { IdCuenta, Banco, ...updateData } = this.cuentaForm;
      setTimeout(() => {
        this.savingCuenta = true;
        this.cuentaService.update(this.cuentaForm.IdCuenta!, updateData).pipe(finalize(() => this.savingCuenta = false)).subscribe({
          next: () => {
            this.cuentaDialog = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta actualizada correctamente.' });
            this.loadCuentas();
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
        });
      }, 0);
    } else {
      setTimeout(() => {
        this.savingCuenta = true;
        this.cuentaService.create(this.cuentaForm).pipe(finalize(() => this.savingCuenta = false)).subscribe({
          next: () => {
            this.cuentaDialog = false;
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta creada correctamente.' });
            this.loadCuentas();
          },
          error: (err: any) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
        });
      }, 0);
    }
  }

  deleteCuenta(cuenta: CuentaBancariaEmpresa, event?: MouseEvent) {
    event?.stopPropagation();

    if (!cuenta.IdCuenta || this.deletingCuenta) {
      return;
    }

    setTimeout(() => {
      this.deletingCuenta = true;
      this.cuentaService.delete(cuenta.IdCuenta!).pipe(finalize(() => this.deletingCuenta = false)).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta eliminada correctamente.' });
          this.loadCuentas();
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        }
      });
    }, 0);
  }

  reactivateCuenta(cuenta: CuentaBancariaEmpresa, event?: MouseEvent) {
    event?.stopPropagation();

    if (!cuenta.IdCuenta) {
      return;
    }

    this.cuentaService.reactivate(cuenta.IdCuenta).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta reactivada correctamente.' });
        this.loadCuentas();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
      }
    });
  }

  hideDialog() {
    this.cuentaDialog = false;
  }
}
