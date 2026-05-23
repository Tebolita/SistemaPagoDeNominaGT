import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';
import { RolService } from '../services/rol.service';
import { RolInterface } from '../models/Rol.model';
import { UsuarioInterface } from '../models/Usuario.model';

interface ModuleCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'coming';
  color: string;
  accent: string;
  features: string[];
}

@Component({
  selector: 'app-seguridad-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './seguridad.html',
  styleUrl: './seguridad.css',
})
export class Seguridad implements OnInit {
  private router         = inject(Router);
  private usuarioService = inject(UsuarioService);
  private rolService     = inject(RolService);

  usuarios = signal<UsuarioInterface[]>([]);
  roles    = signal<RolInterface[]>([]);

  totalUsuariosActivos = computed(() => this.usuarios().length);
  totalRoles           = computed(() => this.roles().filter(r => r.Activo !== false).length);
  totalPermisos        = computed(() =>
    this.roles().reduce((acc, r) => acc + (r.Permisos?.length ?? 0), 0)
  );

  modules: ModuleCard[] = [
    {
      title: 'Usuarios del Sistema',
      description: 'Crea, edita y gestiona los accesos para el personal de la empresa.',
      icon: 'pi pi-user-edit',
      color: 'blue',
      accent: '#3b82f6',
      route: '/seguridad/usuarios',
      status: 'active',
      features: ['Gestión de credenciales', 'Asignación a empleados', 'Reseteo de contraseñas'],
    },
    {
      title: 'Roles y Permisos',
      description: 'Define niveles de acceso y configura exactamente qué puede hacer cada rol.',
      icon: 'pi pi-shield',
      color: 'teal',
      accent: '#14b8a6',
      route: '/seguridad/roles',
      status: 'active',
      features: ['Creación de roles', 'Permisos por módulo', 'Control granular de accesos'],
    },
    {
      title: 'Auditoría de Sesiones',
      description: 'Registro histórico de accesos y acciones realizadas en el sistema.',
      icon: 'pi pi-list-check',
      color: 'violet',
      accent: '#8b5cf6',
      route: '/seguridad/auditoria',
      status: 'active',
      features: ['Logs de inicio de sesión', 'Rastreo de actividad', 'Historial de cambios'],
    },
  ];

  ngOnInit() {
    this.usuarioService.ObtenerUsuarios().subscribe({
      next: (data) => this.usuarios.set(data),
      error: () => {},
    });
    this.rolService.getRoles().subscribe({
      next: (data) => this.roles.set(data),
      error: () => {},
    });
  }

  navigate(route: string, status: string) {
    if (status === 'active') this.router.navigate([route]);
  }
}
