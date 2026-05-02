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
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker'; 

import { VacacionesService } from './vacacion.service';
import { IncidenciaVacacion } from '../models/Vacacion.model';
import { ConfirmationService, MessageService } from 'primeng/api';

import { EmpleadoService } from '../services/empleado.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-vacacion',
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
    CheckboxModule,
    DatePickerModule
  ],
  templateUrl: './vacacion.html',
  styleUrl: './vacacion.css',
  providers: [MessageService, ConfirmationService]
})
// Implementa OnDestroy aquí
export class Vacacion implements OnInit, OnDestroy {
    vacacionesDialog: boolean = false;
    vacaciones: IncidenciaVacacion[] = [];
    vacacion!: IncidenciaVacacion;
    
    // Cambiamos a 'any' temporalmente para poder agregar un 'nombreCompleto'
    empleados: any[] = []; 
    
    submitted: boolean = false;
    private destroy$ = new Subject<void>();
    loading = false;  
    error ='';

    constructor(
        private vacacionesService: VacacionesService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private empleadoService: EmpleadoService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadVacaciones();
        this.cargarEmpleados();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadVacaciones() {
        this.vacacionesService.getVacaciones()
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => {
            // El backend ya filtra solo vacaciones, no necesitamos filtrar aquí
            this.vacaciones = data;
            this.cdr.detectChanges();
        });
    }

    cargarEmpleados(): void {
        this.loading = true;
        this.empleadoService.ObtenerEmplados() // (Ojo: dice Emplados, asumo que así está en tu servicio)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (data) => {
                // Mapeamos para crear un label uniendo Nombres y Apellidos
                this.empleados = data.map(emp => ({
                    ...emp,
                    nombreCompleto: `${emp.Nombres} ${emp.Apellidos}`
                }));
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = err.message;
                this.loading = false;
            }
        });
    }

    openNew() {
        this.vacacion = {
            IdEmpleado: 0,
            TipoIncidencia: 'Vacaciones',
            FechaInicio: '',
            FechaFin: '',
            ConGoceSueldo: true,
            IdUsuarioAutoriza: 1 
        };
        this.submitted = false;
        this.vacacionesDialog = true;
    }

    editVacacion(vacacion: IncidenciaVacacion) {
        this.vacacion = { 
            ...vacacion, 
            FechaInicio: new Date(vacacion.FechaInicio), 
            FechaFin: new Date(vacacion.FechaFin) 
        };
        this.vacacionesDialog = true;
    }

    deleteVacacion(vacacion: IncidenciaVacacion) {
        this.confirmationService.confirm({
            message: '¿Estás seguro de que deseas eliminar este registro de vacaciones?',
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.vacacionesService.deleteVacacion(vacacion.IdIncidencia!).subscribe(() => {
                    this.loadVacaciones();
                    this.messageService.add({severity:'success', summary: 'Exitoso', detail: 'Vacación Eliminada', life: 3000});
                });
            }
        });
    }

    hideDialog() {
        this.vacacionesDialog = false;
        this.submitted = false;
    }

    saveVacacion() {
        this.submitted = true;

        if (this.vacacion.IdEmpleado && this.vacacion.FechaInicio && this.vacacion.FechaFin) {
            if (this.vacacion.IdIncidencia) {
                this.vacacionesService.updateVacacion(this.vacacion.IdIncidencia, this.vacacion).subscribe(() => {
                    this.loadVacaciones();
                    this.messageService.add({severity:'success', summary: 'Exitoso', detail: 'Vacación Actualizada', life: 3000});
                });
            } else {
                this.vacacionesService.createVacacion(this.vacacion).subscribe(() => {
                    this.loadVacaciones();
                    this.messageService.add({severity:'success', summary: 'Exitoso', detail: 'Vacación Creada', life: 3000});
                });
            }
            this.vacacionesDialog = false;
            this.vacacion = null as any;
        }
    }
}