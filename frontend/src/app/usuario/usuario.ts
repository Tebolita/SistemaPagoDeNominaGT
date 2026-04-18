import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Módulos de PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { MessageService, ConfirmationService } from 'primeng/api';

// Servicios y Modelos
import { UsuarioService } from '../services/usuario.service'; 
import { RolService } from '../services/rol.service';
import { EmpleadoService } from '../services/empleado.service';

import { UsuarioInterface } from '../models/Usuario.model';
import { RolInterface } from '../models/Rol.model';
import { EmpleadoResponse } from '../models/Empleado.model';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    ConfirmDialogModule,
    SelectModule 
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class Usuario implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private empleadoService = inject(EmpleadoService);

  // Estados principales
  usuarios = signal<UsuarioInterface[]>([]); 
  loading = signal<boolean>(false);
  
  // Listas para los Dropdowns
  listaRoles = signal<RolInterface[]>([]);
  listaEmpleados = signal<EmpleadoResponse[]>([]);

  // Estados para el Modal (Dialog)
  mostrarDialog = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  
  // Objeto actual para el formulario
  usuarioActual = signal<UsuarioInterface>({} as UsuarioInterface); 

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarRoles();
    this.cargarEmpleados();
  }

  // --- MÉTODOS DE CARGA ---

  cargarUsuarios() {
    this.loading.set(true);
    this.usuarioService.ObtenerUsuarios().subscribe({
      next: (data: UsuarioInterface[]) => {
        this.usuarios.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loading.set(false);
      }
    });
  }

  cargarRoles() {
    this.rolService.getRoles().subscribe({
      next: (data) => this.listaRoles.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles' })
    });
  }

  cargarEmpleados() {
    this.empleadoService.ObtenerEmplados().subscribe({
      next: (data) => this.listaEmpleados.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los empleados' })
    });
  }

  // --- MÉTODOS AUXILIARES PARA LA TABLA ---
  
  obtenerNombreRol(idRol: number | undefined): string {
    if (!idRol) return 'N/A';
    const rol = this.listaRoles().find(r => r.IdRol === idRol);
    return rol ? rol.NombreRol : 'Desconocido';
  }

  obtenerNombreEmpleado(idEmpleado: number | undefined): string {
    if (!idEmpleado) return 'N/A';
    const empleado = this.listaEmpleados().find(e => e.IdEmpleado === idEmpleado);
    return empleado ? `${empleado.Nombres} ${empleado.Apellidos}` : 'Desconocido';
  }

  // --- LÓGICA DEL CRUD ---

  abrirNuevo() {
    // Al ser dropdowns, podemos dejar null para que muestre el placeholder "Seleccione..."
    this.usuarioActual.set({ Username: '', Contrasena: '', Clave: '', IdRol: null as any, IdEmpleado: null as any });
    this.esEdicion.set(false);
    this.mostrarDialog.set(true);
  }

  editarUsuario(usuario: UsuarioInterface) {
    this.usuarioActual.set({ ...usuario, Contrasena: '', Clave: '' });
    this.esEdicion.set(true);
    this.mostrarDialog.set(true);
  }

  guardarUsuario() {
      const usuarioUI = this.usuarioActual();
      
      if (!usuarioUI.Username || !usuarioUI.IdRol || !usuarioUI.IdEmpleado || (!this.esEdicion() && (!usuarioUI.Contrasena || !usuarioUI.Clave))) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Campos requeridos faltantes' });
        return;
      }

      const payload: Partial<UsuarioInterface> = {
        Username: usuarioUI.Username,
        IdRol: Number(usuarioUI.IdRol),
        IdEmpleado: Number(usuarioUI.IdEmpleado)
      };

      if (usuarioUI.Contrasena && usuarioUI.Contrasena.trim() !== '') {
        payload.Contrasena = usuarioUI.Contrasena;
      }
      if (usuarioUI.Clave && usuarioUI.Clave.trim() !== '') {
        payload.Clave = usuarioUI.Clave;
      }

      if (this.esEdicion()) {
        if (!usuarioUI.IdUsuario) return; 
        this.usuarioService.ActualizarUsuario(usuarioUI.IdUsuario, payload).subscribe({
          next: (res: any) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Usuario actualizado' });
            this.mostrarDialog.set(false);
            this.cargarUsuarios(); 
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message })
        });
      } else {
        this.usuarioService.CrearSoloUsuario(payload as UsuarioInterface).subscribe({
          next: (res: any) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Usuario creado' });
            this.mostrarDialog.set(false);
            this.cargarUsuarios();
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message })
        });
      }
    }

  eliminarUsuario(usuario: UsuarioInterface) {
    if (!usuario.IdUsuario) return;

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar al usuario ${usuario.Username}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.usuarioService.EliminarUsuario(usuario.IdUsuario!).subscribe({
          next: (res: any) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Usuario eliminado' });
            this.cargarUsuarios(); 
          },
          error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message })
        });
      }
    });
  }
}