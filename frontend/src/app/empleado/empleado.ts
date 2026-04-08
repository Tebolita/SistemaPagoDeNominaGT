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
import { EmpleadoInterface, EmpleadoResponse } from '../models/Empleado.model';
import { Subject, takeUntil } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { FieldsetModule } from 'primeng/fieldset';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

type Severity = "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined

@Component({
    selector: 'app-empleado',
    imports: [MenubarModule, ButtonModule, Divider, ContextMenuModule, 
        TagModule, ToastModule, CommonModule, AvatarModule, FieldsetModule, IconFieldModule,
        InputIconModule, InputTextModule],
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
    users: EmpleadoInterface[] = [];                       
    selectedUser: EmpleadoInterface | null = null;
    editarUsuario: boolean = false;

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
    }

    getBadge(user: EmpleadoInterface): string | null {  
        if (user.Usuario[0].RolUsuario.NombreRol === 'Member') return 'info';
        if (user.Usuario[0].RolUsuario.NombreRol === 'Guest')  return 'warn';
        return null;
    }

    onContextMenu(event: MouseEvent, user: EmpleadoInterface) {  
        this.selectedUser = user;
        this.cm.show(event);
    }

    onHide() {
        this.selectedUser = null;
    }

    onSelectUser(user: EmpleadoInterface) {
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
        let idEmplado = this.selectedUser!.IdEmpleado;
        let empleadoData = this.selectedUser!;
        this.empleadoService.ActualizarEmpleado(idEmplado, empleadoData)
        .pipe(takeUntil(this.destroy$)) 
        .subscribe({
            next: (res: EmpleadoResponse) => {
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

}