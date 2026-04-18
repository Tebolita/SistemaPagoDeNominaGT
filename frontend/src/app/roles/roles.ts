import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Usamos FormsModule para ngModel

// Módulos de PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';

import { RolService } from '../services/rol.service';
import { RolInterface } from '../models/Rol.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './roles.html'
})
export class Roles implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private rolService = inject(RolService);

  // Estados usando Signals
  roles = signal<RolInterface[]>([]); 
  loading = signal<boolean>(false);
  
  // Estados para el Modal (Dialog)
  mostrarDialog = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  
  // Objeto actual para el formulario
  rolActual = signal<RolInterface>({ NombreRol: '' } as RolInterface); 

  ngOnInit() {
    this.cargarRoles();
  }

  cargarRoles() {
    this.loading.set(true);
    
    this.rolService.getRoles().subscribe({
      next: (data: RolInterface[]) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al cargar roles' });
        this.loading.set(false);
      }
    });
  }

  abrirNuevo() {
    this.rolActual.set({ NombreRol: '' } as RolInterface);
    this.esEdicion.set(false);
    this.mostrarDialog.set(true);
  }

  editarRol(rol: RolInterface) {
    // Clonamos el objeto para no afectar la tabla directamente mientras editamos
    this.rolActual.set({ ...rol });
    this.esEdicion.set(true);
    this.mostrarDialog.set(true);
  }

  guardarRol() {
      const rolUI = this.rolActual();
      
      // Validación básica
      if (!rolUI.NombreRol || rolUI.NombreRol.trim() === '') {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'El nombre del rol es requerido' });
        return;
      }

      // 1. CONSTRUIR UN PAYLOAD LIMPIO 
      const payload: Partial<RolInterface> = {
        NombreRol: rolUI.NombreRol
      };

      if (this.esEdicion()) {
        if (!rolUI.IdRol) return; 

        // Actualizar
        this.rolService.updateRol(rolUI.IdRol, payload).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado correctamente' });
            this.mostrarDialog.set(false);
            this.cargarRoles(); 
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al actualizar' });
          }
        });

      } else {
        // Crear
        this.rolService.createRol(payload as RolInterface).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado correctamente' });
            this.mostrarDialog.set(false);
            this.cargarRoles();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al crear' });
          }
        });
      }
    }

  eliminarRol(rol: RolInterface) {
    if (!rol.IdRol) return;

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar el rol <b>${rol.NombreRol}</b>?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        
        // Lógica de Delete (Borrado Lógico en backend)
        this.rolService.deleteRol(rol.IdRol!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol eliminado correctamente' });
            this.cargarRoles(); 
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message || 'Error al eliminar' });
          }
        });

      }
    });
  }
}