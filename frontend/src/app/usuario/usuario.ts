import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { UsuarioService } from '../services/usuario.service'; 
import { UsuarioInterface } from '../models/Usuario.model';

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
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class Usuario implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private usuarioService = inject(UsuarioService);

  // Estados usando Signals
  usuarios = signal<UsuarioInterface[]>([]); 
  loading = signal<boolean>(false);
  
  // Estados para el Modal (Dialog)
  mostrarDialog = signal<boolean>(false);
  esEdicion = signal<boolean>(false);
  
  // Objeto actual para el formulario
  usuarioActual = signal<UsuarioInterface>({} as UsuarioInterface); 

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading.set(true);
    
    // Consumo real de la API
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

  abrirNuevo() {
    this.usuarioActual.set({ Username: '', Contrasena: '', Clave: '', IdRol: 1, IdEmpleado: 1 });
    this.esEdicion.set(false);
    this.mostrarDialog.set(true);
  }

  editarUsuario(usuario: UsuarioInterface) {
    // Clonamos el objeto. Vaciamos las contraseñas porque el backend no nos las manda
    // y si el usuario las deja en blanco, el backend no las actualizará.
    this.usuarioActual.set({ ...usuario, Contrasena: '', Clave: '' });
    this.esEdicion.set(true);
    this.mostrarDialog.set(true);
  }

  guardarUsuario() {
      const usuarioUI = this.usuarioActual();
      
      // Validación básica
      if (!usuarioUI.Username || !usuarioUI.IdRol || (!this.esEdicion() && (!usuarioUI.Contrasena || !usuarioUI.Clave))) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Campos requeridos faltantes' });
        return;
      }

      // 1. CONSTRUIR UN PAYLOAD LIMPIO 
      const payload: Partial<UsuarioInterface> = {
        Username: usuarioUI.Username,
        IdRol: usuarioUI.IdRol,
        IdEmpleado: usuarioUI.IdEmpleado
      };

      // Solo enviar las contraseñas si el usuario escribió algo
      // Esto evita sobreescribir la contraseña actual con un string vacío ("")
      if (usuarioUI.Contrasena && usuarioUI.Contrasena.trim() !== '') {
        payload.Contrasena = usuarioUI.Contrasena;
      }
      if (usuarioUI.Clave && usuarioUI.Clave.trim() !== '') {
        payload.Clave = usuarioUI.Clave;
      }

      if (this.esEdicion()) {
        if (!usuarioUI.IdUsuario) return; 

        // Enviamos el ID en la URL, y el payload limpio en el Body
        this.usuarioService.ActualizarUsuario(usuarioUI.IdUsuario, payload).subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Usuario actualizado' });
            this.mostrarDialog.set(false);
            this.cargarUsuarios(); 
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
        });

      } else {
        this.usuarioService.CrearSoloUsuario(payload as UsuarioInterface).subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Usuario creado' });
            this.mostrarDialog.set(false);
            this.cargarUsuarios();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
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
        
        // Lógica de Delete real
        this.usuarioService.EliminarUsuario(usuario.IdUsuario!).subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Usuario eliminado' });
            this.cargarUsuarios(); // Recargamos la tabla
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
        });

      }
    });
  }
}