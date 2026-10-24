import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';   

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';

import { AsistenciaService } from '../services/asistencia.service';
import { AsistenciaInterface } from '../models/Asistencias.model';
import { EmpleadoService } from '../services/empleado.service';

@Component({
  selector: 'app-asistencia',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    ToastModule,
    ToolbarModule,
    ConfirmDialogModule,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css', // O scss
  providers: [MessageService, ConfirmationService]
})
export class Asistencia implements OnInit, OnDestroy {
    asistenciaDialog: boolean = false;
    asistencias: AsistenciaInterface[] = [];
    // Paginación en el servidor
    totalAsistencias = 0;
    filasPorPagina = 10;
    paginaActual = 1;
    cargandoTabla = false;
    asistencia!: AsistenciaInterface;
    empleados: any[] = []; 
    submitted: boolean = false;
    
    private destroy$ = new Subject<void>();

    constructor(
        private asistenciaService: AsistenciaService,
        private empleadoService: EmpleadoService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        // La primera página la pide la tabla (onLazyLoad) al iniciarse
        this.cargarEmpleados();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Carga la página actual; la tabla la invoca al iniciar y al cambiar de página
    loadAsistencias() {
        this.cargandoTabla = true;
        this.asistenciaService.getAsistenciasPaginadas(this.paginaActual, this.filasPorPagina)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (data) => {
                this.asistencias = data.registros;
                this.totalAsistencias = data.total;
                this.cargandoTabla = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.cargandoTabla = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
                this.cdr.detectChanges();
            },
        });
    }

    onLazyLoad(event: TableLazyLoadEvent) {
        this.filasPorPagina = event.rows ?? this.filasPorPagina;
        this.paginaActual = Math.floor((event.first ?? 0) / this.filasPorPagina) + 1;
        // La tabla emite onLazyLoad durante su primera detección de cambios; cambiar
        // cargandoTabla en ese mismo ciclo provoca NG0100 (ExpressionChanged). Se difiere un tick.
        setTimeout(() => {
            this.loadAsistencias();
            this.cdr.markForCheck();
        });
    }

    cargarEmpleados(): void {
        this.empleadoService.ObtenerEmplados()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (data) => {
                this.empleados = data.map(emp => ({
                    ...emp,
                    nombreCompleto: `${emp.Nombres} ${emp.Apellidos}`
                }));
                this.cdr.detectChanges();
            }
        });
    }

    openNew() {
        this.asistencia = {
            IdEmpleado: 0,
            Fecha: new Date(),
            HoraEntrada: new Date(),
            HoraSalida: null,
            HorasExtra: 0
        };
        this.submitted = false;
        this.asistenciaDialog = true;
    }

    editAsistencia(asistencia: AsistenciaInterface) {
        this.asistencia = { 
            ...asistencia,
            Fecha: new Date(asistencia.Fecha),
            HoraEntrada: new Date(asistencia.HoraEntrada),
            HoraSalida: asistencia.HoraSalida ? new Date(asistencia.HoraSalida) : null
        };
        this.asistenciaDialog = true;
    }

    deleteAsistencia(asistencia: AsistenciaInterface) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de eliminar este registro de asistencia?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.asistenciaService.deleteAsistencia(asistencia.IdAsistencia!).subscribe(() => {
                    this.loadAsistencias();
                    this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Registro eliminado'});
                });
            }
        });
    }

    hideDialog() {
        this.asistenciaDialog = false;
        this.submitted = false;
    }

    saveAsistencia() {
        this.submitted = true;

        if (this.asistencia.IdEmpleado && this.asistencia.Fecha && this.asistencia.HoraEntrada) {
            
            // IMPORTANTE: Limpiamos el objeto Empleado para que Prisma no dé error al guardar
            const { Empleado, ...datosGuardar } = this.asistencia as any;

            if (this.asistencia.IdAsistencia) {
                this.asistenciaService.updateAsistencia(this.asistencia.IdAsistencia, datosGuardar).subscribe(() => {
                    this.loadAsistencias();
                    this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Asistencia Actualizada'});
                    this.asistenciaDialog = false;
                });
            } else {
                this.asistenciaService.createAsistencia(datosGuardar).subscribe(() => {
                    this.loadAsistencias();
                    this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Asistencia Creada'});
                    this.asistenciaDialog = false;
                });
            }
        }
    }
}
