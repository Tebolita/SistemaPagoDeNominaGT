import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Módulos de PrimeNG (Asegúrate de tenerlos instalados y actualizados) ---
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { MenubarModule } from 'primeng/menubar';
import { TagModule } from 'primeng/tag';
import { ContextMenuModule } from 'primeng/contextmenu';
import { FieldsetModule } from 'primeng/fieldset';
import { AvatarModule } from 'primeng/avatar';
import { DatePickerModule } from 'primeng/datepicker'; // O CalendarModule dependiendo de tu versión exacta
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';

// --- Servicios y Modelos ---
import { EmpleadoService } from '../services/empleado.service';
import { RolService } from '../services/rol.service';
// import { PuestoService } from '../services/puesto.service'; <-- Descomenta cuando lo tengas

import { EmpleadoResponse, EmpleadoRequest } from '../models/Empleado.model';
import { RolInterface } from '../models/Rol.model';
import { UsuarioInterface } from '../models/Usuario.model';

@Component({
  selector: 'app-empleados',
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
    SelectModule,
    DividerModule,
    MenubarModule,
    TagModule,
    ContextMenuModule,
    FieldsetModule,
    AvatarModule,
    DatePickerModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './empleado.html',
  styleUrl: './empleado.css'
})
export class Empleado implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  
  private empleadoService = inject(EmpleadoService);
  private rolService = inject(RolService);
  // private puestoService = inject(PuestoService); 

  // --- ESTADOS PRINCIPALES (UI y Datos) ---
  users = signal<EmpleadoResponse[]>([]);
  selectedUser = signal<EmpleadoResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');
  messageResponsive = signal<string>('');

  vacacionesEmpleado = signal<any[]>([]);
  asistenciasEmpleado = signal<any[]>([]);

  items = signal<MenuItem[]>([]);
  usuarios = signal<MenuItem[]>([]); 

  editarUsuario = signal<boolean>(true); 

  // --- ESTADOS PARA EL DIALOGO DE CREACIÓN ---
  dialogVisible = signal<boolean>(false);
  errorDialog = signal<string>('');
  
  nuevoEmpleado = signal<Partial<EmpleadoRequest>>({});
  nuevoUsuario = signal<Partial<UsuarioInterface>>({}); 

  // --- CATÁLOGOS PARA DROPDOWNS ---
  roles = signal<RolInterface[]>([]);
  puestos = signal<any[]>([]); // Cambia 'any' por tu PuestoInterface
  generos = signal<{label: string, value: boolean}[]>([
    { label: 'Masculino', value: false },
    { label: 'Femenino', value: true }
  ]);
  JornadaLaboral = signal<{IdJornada: number, NombreJornada: string}[]>([
    { IdJornada: 1, NombreJornada: 'Diurna' }
  ]);

  ngOnInit() {
    this.configurarMenus();
    this.cargarDatosBase();
  }

  // --- CONFIGURACIÓN DE MENÚS ---
  configurarMenus() {
    this.items.set([
      { icon: 'pi pi-user-plus', severity: 'success', command: () => this.onCreateUser() }
    ]);

    this.usuarios.set([
      { label: 'Ver detalles', icon: 'pi pi-eye' },
      { label: 'Dar de baja', icon: 'pi pi-trash', command: () => this.onDeleteUser() }
    ]);
  }

  // --- CARGA DE DATOS ---
  cargarDatosBase() {
    this.cargarEmpleados();
    this.cargarRoles();
    this.cargarPuestos();
  }

  cargarEmpleados() {
    this.loading.set(true);
    this.empleadoService.ObtenerEmplados().subscribe({
      next: (data: EmpleadoResponse[]) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar los empleados.');
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loading.set(false);
      }
    });
  }

  cargarRoles() {
    this.rolService.getRoles().subscribe({
      next: (data) => this.roles.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles' })
    });
  }

  cargarPuestos() {
    // Aquí llamas a tu PuestoService. Por ahora dejo un mock para que el dropdown no esté vacío.
    this.puestos.set([
      { IdPuesto: 1, NombrePuesto: 'Gerente' },
      { IdPuesto: 2, NombrePuesto: 'Desarrollador' }
    ]);
  }

  // --- INTERACCIONES DE LA VISTA ---
  
  onSelectUser(user: EmpleadoResponse) {
    this.selectedUser.set(user);
    this.messageResponsive.set('');
    // Aquí podrías cargar las vacaciones y asistencias del empleado seleccionado llamando a otro servicio
    this.vacacionesEmpleado.set([]); 
    this.asistenciasEmpleado.set([]);
    console.log(user)
  }

  onContextMenu(event: Event, user: EmpleadoResponse) {
    this.selectedUser.set(user);
  }

  // --- LÓGICA DEL CRUD ---

  onCreateUser() {
    this.errorDialog.set('');
    this.nuevoEmpleado.set({ Genero: false, Activo: true }); // Valores por defecto
    this.nuevoUsuario.set({}); // Limpiar usuario
    this.dialogVisible.set(true);
  }

  onCancelDialog() {
    this.dialogVisible.set(false);
    this.nuevoEmpleado.set({});
    this.nuevoUsuario.set({});
  }

  onSaveUser() {
    const empData = this.nuevoEmpleado() as EmpleadoRequest;
    
    // Validaciones básicas
    if (!empData.Nombres || !empData.Apellidos || !empData.DPI) {
      this.errorDialog.set('Por favor completa los campos obligatorios (Nombres, Apellidos, DPI).');
      return;
    }

    this.loading.set(true);
    this.errorDialog.set('');

    // Construir el payload final. Si tu backend espera el usuario anidado, lo envías aquí.
    const payload = {
      ...empData,
    };

    this.empleadoService.CrearEmpleado(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: res.message || 'Empleado creado correctamente' });
        this.dialogVisible.set(false);
        this.cargarEmpleados();
      },
      error: (err) => {
        this.errorDialog.set(err.error?.message || 'Ocurrió un error al guardar el empleado.');
        this.loading.set(false);
      }
    });
  }

  onUpdateUser() {
    const userToUpdate = this.selectedUser();
    if (!userToUpdate) return;

    this.loading.set(true);
    this.messageResponsive.set('');

    const payload: Partial<EmpleadoRequest> = {
      Nombres: userToUpdate.Nombres,
      Apellidos: userToUpdate.Apellidos,
      DPI: userToUpdate.DPI,
      NIT: userToUpdate.NIT,
      CorreoPersonal: userToUpdate.CorreoPersonal,
      Telefono: userToUpdate.Telefono.toString(),
      Direccion: userToUpdate.Direccion,
      EstadoCivil: userToUpdate.EstadoCivil,
      IdJornada: 1
    };

    this.empleadoService.ActualizarEmpleado(userToUpdate.IdEmpleado, payload).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Información actualizada correctamente.' });
        this.messageResponsive.set('Datos guardados con éxito.');
        this.cargarEmpleados();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.loading.set(false);
      }
    });
  }

  onDeleteUser() {
    const user = this.selectedUser();
    if (!user) return;

    const accion = user.Activo ? 'dar de baja' : 'reactivar';

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas ${accion} al empleado ${user.Nombres}?`,
      header: 'Confirmar Acción',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.loading.set(true);
        this.empleadoService.EliminarEmpleado(user.IdEmpleado).subscribe({
          next: (res: any) => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Empleado actualizado.` });
            this.selectedUser.set(null);
            this.cargarEmpleados();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
            this.loading.set(false);
          }
        });
      }
    });
  }
}