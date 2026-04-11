import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';   

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker'; 
import { InputNumberModule } from 'primeng/inputnumber'; // Para las horas extra
import { TagModule } from 'primeng/tag'; // Para que se vea bonito

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
    TagModule
  ],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css', // O scss
  providers: [MessageService, ConfirmationService]
})
export class Asistencia implements OnInit, OnDestroy {
    asistenciaDialog: boolean = false;
    asistencias: AsistenciaInterface[] = [];
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
        this.loadAsistencias();
        this.cargarEmpleados();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadAsistencias() {
        this.asistenciaService.getAsistencias()
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
            this.asistencias = data;
            this.cdr.detectChanges();
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
