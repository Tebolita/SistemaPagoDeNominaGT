import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { finalize } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CuentaBancariaEmpresaService } from '../../services/cuenta-bancaria-empresa.service';
import { BancoService } from '../../services/banco.service';
import { CuentaBancariaEmpresa } from '../../models/CuentaBancariaEmpresa.model';

@Component({
  selector: 'app-cuenta-bancaria',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, InputNumberModule, SelectModule, TagModule,
    ToastModule, TooltipModule, ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cuenta-bancaria.html',
  styleUrl: './cuenta-bancaria.css',
})
export class CuentaBancariaComponent implements OnInit {
  cuentas: CuentaBancariaEmpresa[] = [];
  bancos: any[] = [];
  cuentaForm: Partial<CuentaBancariaEmpresa> = {};
  cuentaDialog = false;
  isEdit = false;
  loading = false;
  saving = false;

  tiposCuenta = [
    { label: 'Corriente',         value: 'CORRIENTE'        },
    { label: 'Ahorros',           value: 'AHORROS'          },
    { label: 'Moneda Extranjera', value: 'MONEDA_EXTRANJERA' },
  ];

  monedas = [
    { label: 'Quetzal (GTQ)', value: 'GTQ' },
    { label: 'Dólar (USD)',   value: 'USD' },
    { label: 'Euro (EUR)',    value: 'EUR' },
  ];

  private messageService     = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cuentaService      = inject(CuentaBancariaEmpresaService);
  private bancoService       = inject(BancoService);
  private cdr                = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadBancos();
    this.loadCuentas();
  }

  get saldoTotal(): number {
    return this.cuentas
      .filter(c => c.Activo && c.Moneda === 'GTQ')
      .reduce((s, c) => s + Number(c.SaldoActual ?? 0), 0);
  }

  loadBancos() {
    this.bancoService.getAll().subscribe({
      next: (data: any[]) => { this.bancos = data; this.cdr.markForCheck(); },
      error: (err: any) => this.showError(err),
    });
  }

  loadCuentas() {
    this.loading = true;
    this.cuentaService.getAll().subscribe({
      next: (data) => { this.cuentas = data; this.loading = false; this.cdr.markForCheck(); },
      error: (err: any) => { this.loading = false; this.showError(err); },
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
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Banco, número y nombre son obligatorios.' });
      return;
    }
    if (this.saving) return;

    this.saving = true;
    const obs = this.isEdit && this.cuentaForm.IdCuenta
      ? this.cuentaService.update(this.cuentaForm.IdCuenta, (() => { const { IdCuenta, Banco, ...d } = this.cuentaForm; return d; })())
      : this.cuentaService.create(this.cuentaForm);

    obs.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.cuentaDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Cuenta ${this.isEdit ? 'actualizada' : 'creada'} correctamente.` });
        this.loadCuentas();
      },
      error: (err: any) => this.showError(err),
    });
  }

  deleteCuenta(cuenta: CuentaBancariaEmpresa) {
    this.confirmationService.confirm({
      message: `¿Desactivar la cuenta <strong>${cuenta.NombreCuenta}</strong>?`,
      header: 'Confirmar desactivación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cuentaService.delete(cuenta.IdCuenta).pipe(finalize(() => this.cdr.detectChanges())).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta desactivada.' });
            this.loadCuentas();
          },
          error: (err: any) => this.showError(err),
        });
      },
    });
  }

  reactivateCuenta(cuenta: CuentaBancariaEmpresa) {
    this.cuentaService.reactivate(cuenta.IdCuenta).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta reactivada.' });
        this.loadCuentas();
      },
      error: (err: any) => this.showError(err),
    });
  }

  hideDialog() { this.cuentaDialog = false; }

  Number = Number;

  private showError(err: any) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.message ?? 'Error inesperado' });
  }
}
