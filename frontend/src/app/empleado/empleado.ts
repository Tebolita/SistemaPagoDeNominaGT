import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';

type Severity = "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | null | undefined

interface Users {
    id: number;
    name: string;
    image: string;
    role: string;
    severity: Severity;
}

@Component({
    selector: 'app-empleado',
    imports: [MenubarModule, ButtonModule, Divider, ContextMenuModule, TagModule, ToastModule, CommonModule],
    providers: [MessageService],
    templateUrl: './empleado.html',
    styleUrl: './empleado.css',
})
export class Empleado implements OnInit {
    @ViewChild('cm') cm!: ContextMenu;  
    items: MenuItem[] | undefined;
    usuarios: MenuItem[] | undefined;
    users: Users[] = [];                       
    selectedUser: Users | null = null;  

    private messageService = inject(MessageService);

    ngOnInit() {
        this.items = [
            { icon: 'pi pi-user-plus', severity: 'success' },
            { icon: 'pi pi-file-export', severity: 'warn' },
        ];

        this.users = [
            { id: 0, name: 'Kevin Alejandro Reyes Revolorio', image: 'amyelsner.png', role: 'Admin', severity: 'danger' },
            { id: 1, name: 'Anna Fali',         image: 'annafali.png',         role: 'Member', severity: 'secondary' },
            { id: 2, name: 'Asiya Javayant',    image: 'asiyajavayant.png',    role: 'Member', severity: 'secondary' },
            { id: 3, name: 'Bernardo Dominic',  image: 'bernardodominic.png',  role: 'Guest', severity: 'warn'  },
            { id: 4, name: 'Elwin Sharvill',    image: 'elwinsharvill.png',    role: 'Member', severity: 'secondary' }
        ];

        this.usuarios = [
            {
                label: 'Roles',
                icon: 'pi pi-users',
                items: [
                    { label: 'Admin',  command: () => { if (this.selectedUser) this.selectedUser.role = 'Admin', this.selectedUser.severity = 'danger';  } },
                    { label: 'Member', command: () => { if (this.selectedUser) this.selectedUser.role = 'Member', this.selectedUser.severity = 'secondary'; } },
                    { label: 'Guest',  command: () => { if (this.selectedUser) this.selectedUser.role = 'Guest', this.selectedUser.severity = 'warn';  } }
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
    }

    getBadge(user: Users): string | null {  
        if (user.role === 'Member') return 'info';
        if (user.role === 'Guest')  return 'warn';
        return null;
    }

    onContextMenu(event: MouseEvent, user: Users) {  
        this.selectedUser = user;
        this.cm.show(event);
    }

    onHide() {
        this.selectedUser = null;
    }

    onSelectUser(user: Users) {
        console.log(user)
        this.selectedUser = user;
    }
}