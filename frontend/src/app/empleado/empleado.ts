import { Component, OnInit, inject, ViewChild, OnDestroy, ChangeDetectorRef  } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { EmpleadoService } from '../services/empleado.service';
import { EmpleadoResponse, EmpleadoRequest, EmpleadoResponseCUD } from '../models/Empleado.model';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { FieldsetModule } from 'primeng/fieldset';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule }    from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { UsuarioService } from '../services/usuario.service';
import { UsuarioRequest } from '../models/Usuario.model';
import { PasswordModule } from 'primeng/password';


type Severity = "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined

interface City {
    name: string;
    code: string;
}

@Component({
    selector: 'app-empleado',
    imports: [MenubarModule, ButtonModule, Divider, ContextMenuModule, 
        TagModule, ToastModule, CommonModule, AvatarModule, FieldsetModule, IconFieldModule,
        InputIconModule, InputTextModule, FormsModule, SelectModule, DialogModule, DatePickerModule, PasswordModule],
    providers: [MessageService],
    templateUrl: './empleado.html',
    styleUrl: './empleado.css',
})
export class Empleado implements OnInit, OnDestroy {
    @ViewChild('cm') cm!: ContextMenu;
    loading = false;  
    error ='';
    messageResponsive = '';
    private destroy$ = new Subject<void>();

    items: MenuItem[] | undefined;
    usuarios: MenuItem[] | undefined;
    users: EmpleadoResponse[] = [];                       
    selectedUser: EmpleadoResponse | null = null;
    editarUsuario: boolean = false;

    cities: City[]| undefined;
    selectedCity: City | undefined;

    private messageService = inject(MessageService);

    constructor(
        private empleadoService: EmpleadoService,
        private cdr: ChangeDetectorRef,
        private usuarioService: UsuarioService
    ) {}

    ngOnInit() {
        this.items = [
            { icon: 'pi pi-user-plus', severity: 'success' },
            { icon: 'pi pi-file-export', severity: 'warn' },
        ];

        this.usuarios = [
            {
                label: 'Roles',
                icon: 'pi pi-users',
                items: [
                    { label: 'Admin',  command: () => { if (this.selectedUser) this.selectedUser.Usuario[0].RolUsuario.NombreRol = 'Admin' } },
                    { label: 'Member', command: () => { if (this.selectedUser) this.selectedUser.Usuario[0].RolUsuario.NombreRol = 'Member' } },
                    { label: 'Guest',  command: () => { if (this.selectedUser) this.selectedUser.Usuario[0].RolUsuario.NombreRol = 'Guest'  } }
                ]
            },
            {
                label: 'Invite',
                icon: 'pi pi-user-plus',
                command: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Invitation sent!',
                        life: 3000
                    });
                }
            }
        ];

        this.cargarEmpleados();

        this.cities = [
            { name: 'New York', code: 'NY' },
            { name: 'Rome', code: 'RM' },
            { name: 'London', code: 'LDN' },
            { name: 'Istanbul', code: 'IST' },
            { name: 'Paris', code: 'PRS' }
        ];
    }

    getBadge(user: EmpleadoResponse): string | null {  
        if (user.Usuario[0].RolUsuario.NombreRol === 'Member') return 'info';
        if (user.Usuario[0].RolUsuario.NombreRol === 'Guest')  return 'warn';
        return null;
    }

    onContextMenu(event: MouseEvent, user: EmpleadoResponse) {  
        this.selectedUser = user;
        this.cm.show(event);
    }

    onSelectUser(user: EmpleadoResponse) {
        this.editarUsuario = true;
        this.selectedUser = user;
    }

    // Consumir empleados
    cargarEmpleados(): void{
        this.loading = true;
        this.empleadoService.ObtenerEmplados()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: (data) => {
                this.users = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = err.message;
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    onUpdateUser(){
        this.loading = true; 
        let data: EmpleadoRequest = {
            DPI: this.selectedUser?.DPI!,
            NIT:this.selectedUser?.NIT!,
            Nombres: this.selectedUser?.Nombres!,
            Apellidos:this.selectedUser?.Apellidos!,
            CorreoPersonal: this.selectedUser?.CorreoPersonal!,
            FechaIngresa: this.selectedUser?.FechaIngresa ? new Date(this.selectedUser.FechaIngresa) : null,
            IdPuesto: this.selectedUser?.IdPuesto!,
            Estado: this.selectedUser?.Estado!,
            FechaEliminacion: this.selectedUser?.FechaEliminacion ? new Date(this.selectedUser.FechaEliminacion) : null,
            Telefono: this.selectedUser?.Telefono!,
            Genero: this.selectedUser?.Genero!,
            EstadoCivil: this.selectedUser?.EstadoCivil!,
            Direccion: this.selectedUser?.Direccion!,
            Fotografia: this.selectedUser?.Fotografia!,
        }
        let idEmpleado = this.selectedUser?.IdEmpleado!;

        this.empleadoService.ActualizarEmpleado(idEmpleado, data)
        .pipe(takeUntil(this.destroy$)) 
        .subscribe({
            next: (res: EmpleadoResponseCUD) => {
                this.messageResponsive = res.message;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = err.message;
                this.loading = false;
                this.cdr.detectChanges();
            }
        })
    }

    ngOnDestroy(): void{
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDeleteUser(){
        if (!this.selectedUser) return;
        this.loading = true;

        const nuevoEstado = !this.selectedUser.Estado;

        this.selectedUser = {
        ...this.selectedUser,
        Estado: nuevoEstado
        };

        let data: EmpleadoRequest = {
        DPI: this.selectedUser.DPI,
        NIT: this.selectedUser.NIT,
        Nombres: this.selectedUser.Nombres,
        Apellidos: this.selectedUser.Apellidos,
        CorreoPersonal: this.selectedUser.CorreoPersonal,
        FechaIngresa: this.selectedUser.FechaIngresa ? new Date(this.selectedUser.FechaIngresa) : null,
        IdPuesto: this.selectedUser.IdPuesto,
        Estado: nuevoEstado,  // ← mismo valor, sin negar de nuevo
        FechaEliminacion: this.selectedUser.FechaEliminacion ? new Date(this.selectedUser.FechaEliminacion) : null,
        Telefono: this.selectedUser.Telefono,
        Genero: this.selectedUser.Genero,
        EstadoCivil: this.selectedUser.EstadoCivil,
        Direccion: this.selectedUser.Direccion,
        Fotografia: this.selectedUser.Fotografia,
        };
        let idEmpleado = this.selectedUser?.IdEmpleado!;
        
        this.empleadoService.ActualizarEmpleado(idEmpleado, data)
        .pipe(takeUntil(this.destroy$)) 
        .subscribe({
            next: (res: EmpleadoResponseCUD) => {
                this.messageResponsive = res.message;
                this.loading = false;
                this.cargarEmpleados();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.error = err.message;
                this.loading = false;
                this.cdr.detectChanges();
            }
        })
    }

    // Variables
    dialogVisible = false;
    errorDialog   = '';

    nuevoEmpleado: Partial<EmpleadoRequest> = {};
    // Agrega esta nueva variable junto a nuevoEmpleado
    nuevoUsuario: Partial<UsuarioRequest> = {};
    generos = [

    { label: 'Masculino', value: false },

    { label: 'Femenino',  value: true  }

    ];



    estados = [{ label: 'Activo',   value: true  },{ label: 'Inactivo', value: false }];

    puestos = [{ IdPuesto: 1, NombrePuesto: 'Hola' }];

    roles = [{IdRol: 1,   NombreRol: 'Administracion' }];


    // Abrir y limpiar
    onCreateUser(): void {
    this.nuevoEmpleado = {
        Estado: true,
        Genero: false,
        IdPuesto: 1,
        FechaIngresa: null,
        FechaEliminacion: null,
    };
    
    // Limpiamos el usuario
    this.nuevoUsuario = {}; 

    this.errorDialog = '';
    this.dialogVisible = true;
    }

    onCancelDialog(): void {
    this.dialogVisible = false;
    this.errorDialog = '';
    this.nuevoEmpleado = {};
    this.nuevoUsuario = {}; // Limpiamos también aquí
    }

    onSaveUser(): void {
    // Validación básica del empleado
    if (!this.nuevoEmpleado.Nombres || !this.nuevoEmpleado.DPI || !this.nuevoEmpleado.CorreoPersonal) {
        this.errorDialog = 'Nombres, DPI y Correo personal son requeridos para el empleado';
        return;
    }

    // Si ingresó algún dato del usuario, validar que estén completos (opcional según tus reglas de negocio)
    if (this.nuevoUsuario.Username || this.nuevoUsuario.IdRol) {
        if (!this.nuevoUsuario.Username || !this.nuevoUsuario.Contrasena || !this.nuevoUsuario.IdRol) {
        this.errorDialog = 'Si vas a crear un usuario, Username, Contraseña y Rol son requeridos';
        return;
        }
    }

    this.loading = true;
    this.errorDialog = '';

    // Paso 1: Crear Empleado
    this.empleadoService.CrearEmpleado(this.nuevoEmpleado as EmpleadoRequest)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: (res: EmpleadoResponseCUD) => {
            
            // Paso 2: Crear el Usuario si llenaron el formulario de usuario
            if (this.nuevoUsuario.Username) {
                // Asignamos el IdEmpleado devuelto por la API
                this.nuevoUsuario.IdEmpleado = Number(res.id); 
                
                this.usuarioService.CrearUsuario(this.nuevoUsuario as UsuarioRequest)
                .subscribe({
                    next: (resUser) => {
                    this.finalizarGuardado();
                    },
                    error: (errUser) => {
                    this.errorDialog = 'Empleado creado, pero falló al crear el usuario: ' + errUser.message;
                    this.loading = false;
                    this.cdr.detectChanges();
                    }
                });
            } else {
                // Si no se llenaron los datos de usuario, cerramos directo
                this.finalizarGuardado();
            }
        },
        error: (err) => {
            this.errorDialog = err.message;
            this.loading = false;
            this.cdr.detectChanges();
        }
        });
    }

        // Método auxiliar para no repetir código
        private finalizarGuardado(): void {
        this.loading = false;
        this.dialogVisible = false;
        this.cargarEmpleados();
        this.cdr.detectChanges();
        }  
}