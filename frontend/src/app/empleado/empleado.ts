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

type Severity = "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined

interface City {
    name: string;
    code: string;
}

@Component({
    selector: 'app-empleado',
    imports: [MenubarModule, ButtonModule, Divider, ContextMenuModule, 
        TagModule, ToastModule, CommonModule, AvatarModule, FieldsetModule, IconFieldModule,
        InputIconModule, InputTextModule, FormsModule, SelectModule],
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
        private cdr: ChangeDetectorRef
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
        console.log(data);
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
        console.log(this.selectedUser?.Apellidos)
    }

    private parsearFecha(fecha: string | null): string | null {
    if (!fecha) return null;
    const [day, month, year ] = fecha.split('/');
    const [hour, minute, second ] = fecha.split(':');

    return new Date(`${year}-${month}-${day} ${hour}:${minute}:${second}`).toISOString();
}

}