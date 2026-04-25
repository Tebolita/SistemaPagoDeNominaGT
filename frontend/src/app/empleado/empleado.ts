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
import { AsistenciaService } from '../services/asistencia.service';
import { VacacionesService } from '../vacacion/vacacion.service';
import { UsuarioService } from '../services/usuario.service';
import { PuestoService } from '../services/puesto.service'; // ✅ Descomentado
import { JornadaLaboralService } from '../services/jornada-laboral.service';
import { BancoService } from '../services/banco.service';
import { SalarioService } from '../services/salario.service';

import { EmpleadoResponse, EmpleadoRequest } from '../models/Empleado.model';
import { RolInterface } from '../models/Rol.model';
import { UsuarioInterface } from '../models/Usuario.model';
import { Puesto } from '../models/Puesto.model'; // ✅ Importado
import { JornadaLaboral } from '../models/JornadaLaboral.model';
import { Banco } from '../models/Banco.model';
import { SalarioResponse } from '../models/Salario.model';

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
  private asistenciaService = inject(AsistenciaService);
  private vacacionesService = inject(VacacionesService);
  private usuarioService = inject(UsuarioService);
  private puestoService = inject(PuestoService); // ✅ Inyectado 
  private jornadaService = inject(JornadaLaboralService);
  private bancoService = inject(BancoService);
  private salarioService = inject(SalarioService);

  // --- ESTADOS PRINCIPALES (UI y Datos) ---
  users = signal<EmpleadoResponse[]>([]);
  selectedUser = signal<EmpleadoResponse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');
  messageResponsive = signal<string>('');

  vacacionesEmpleado = signal<any[]>([]);
  asistenciasEmpleado = signal<any[]>([]);
  historialSalario = signal<SalarioResponse[]>([]);

  items = signal<MenuItem[]>([]);
  usuarios = signal<MenuItem[]>([]); 

  editarUsuario = signal<boolean>(true); 

  // --- ESTADOS PARA EL DIALOGO DE CREACIÓN ---
  dialogVisible = signal<boolean>(false);
  errorDialog = signal<string>('');
  
  nuevoEmpleado = signal<Partial<EmpleadoRequest>>({});
  nuevoUsuario = signal<Partial<UsuarioInterface>>({}); 

  // --- ESTADOS PARA EL DIÁLOGO DE SALARIO ---
  salarioDialogVisible = signal<boolean>(false);
  nuevoSalario = signal<{SalarioBase: number, FechaInicioVigencia: string, FechaFinVigencia: string}>({SalarioBase: 0, FechaInicioVigencia: '', FechaFinVigencia: ''}); 

  // --- CATÁLOGOS PARA DROPDOWNS ---
  roles = signal<RolInterface[]>([]);
  puestos = signal<Puesto[]>([]); // ✅ Tipo correcto
  jornadas = signal<JornadaLaboral[]>([]);
  bancos = signal<Banco[]>([]);
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
    this.cargarJornadas();
    this.cargarBancos();
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
    this.puestoService.getAll().subscribe({
      next: (data) => this.puestos.set(data),
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los puestos'
      })
    });
  }

  cargarJornadas() {
    this.jornadaService.getAll().subscribe({
      next: (data) => this.jornadas.set(data),
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las jornadas laborales'
      })
    });
  }

  cargarBancos() {
    this.bancoService.getAll().subscribe({
      next: (data) => this.bancos.set(data),
      error: () => this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los bancos'
      })
    });
  }

  loadVacaciones(idEmpleado: number) {
    this.vacacionesEmpleado.set([]);
    this.vacacionesService.getVacaciones().subscribe({
      next: (data) => this.vacacionesEmpleado.set(data.filter(v => v.IdEmpleado === idEmpleado)),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las vacaciones del empleado' })
    });
  }

  loadAsistencias(idEmpleado: number) {
    this.asistenciasEmpleado.set([]);
    this.asistenciaService.getAsistencias().subscribe({
      next: (data) => this.asistenciasEmpleado.set(data.filter(a => a.IdEmpleado === idEmpleado)),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las asistencias del empleado' })
    });
  }

  loadSalarios(idEmpleado: number) {
    this.historialSalario.set([]);
    this.salarioService.findByEmpleado(idEmpleado).subscribe({
      next: (data) => this.historialSalario.set(data),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el historial de salarios' })
    });
  }

  // --- INTERACCIONES DE LA VISTA ---
  
  onSelectUser(user: EmpleadoResponse) {
    this.selectedUser.set(user);
    this.messageResponsive.set('');
    this.loadVacaciones(user.IdEmpleado);
    this.loadAsistencias(user.IdEmpleado);
    this.loadSalarios(user.IdEmpleado);
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
      IdJornada: userToUpdate.IdJornada ?? userToUpdate.JornadaLaboral?.IdJornada,
      IdBanco: userToUpdate.IdBanco ?? userToUpdate.Banco?.IdBanco,
      CuentaBancaria: userToUpdate.CuentaBancaria
    };

    this.empleadoService.ActualizarEmpleado(userToUpdate.IdEmpleado, payload).subscribe({
      next: (res: any) => {
        const usuarioRelacionado = userToUpdate.Usuario?.[0];
        if (usuarioRelacionado?.IdUsuario && usuarioRelacionado.IdRol !== undefined) {
          this.usuarioService.ActualizarUsuario(usuarioRelacionado.IdUsuario, { IdRol: Number(usuarioRelacionado.IdRol) }).subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Información y rol actualizados correctamente.' });
              this.messageResponsive.set('Datos guardados con éxito.');
              this.cargarEmpleados();
            },
            error: (err) => {
              this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Empleado actualizado, pero no se pudo actualizar el rol.' });
              this.cargarEmpleados();
            }
          });
        } else {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Información actualizada correctamente.' });
          this.messageResponsive.set('Datos guardados con éxito.');
          this.cargarEmpleados();
        }
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