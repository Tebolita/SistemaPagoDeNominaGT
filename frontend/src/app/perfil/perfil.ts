import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { UsuarioService } from '../services/usuario.service';
import { UsuarioInterface } from '../models/Usuario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, TagModule, ToastModule, DividerModule],
  providers: [MessageService],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private messageService = inject(MessageService);

  usuario    = signal<UsuarioInterface | null>(null);
  saving     = signal(false);

  form = { passwordActual: '', passwordNueva: '', passwordConfirm: '', claveNueva: '' };

  private idUsuario = 0;
  username   = '';
  role       = '';
  initials   = '';

  ngOnInit() {
    this.username  = localStorage.getItem('username') ?? '';
    this.role      = localStorage.getItem('user_role') ?? '';
    this.initials  = this.username.split(/[._\s]+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || 'U';

    const stored = localStorage.getItem('id_usuario');
    if (stored) {
      this.idUsuario = parseInt(stored);
      this.usuarioService.ObtenerUsuarioPorId(this.idUsuario).subscribe({
        next: (u) => this.usuario.set(u),
        error: () => {},
      });
    }
  }

  getRoleSeverity(): 'danger' | 'warn' | 'info' | 'secondary' {
    const r = this.role.toUpperCase();
    if (r.includes('ADMIN')) return 'danger';
    if (r.includes('GERENTE')) return 'warn';
    if (r.includes('RRHH') || r.includes('RECURSOS')) return 'info';
    return 'secondary';
  }

  cambiarPassword() {
    if (!this.form.passwordActual || !this.form.passwordNueva) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Completa todos los campos' });
      return;
    }
    if (this.form.passwordNueva !== this.form.passwordConfirm) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (this.form.passwordNueva.length < 6) {
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    this.saving.set(true);
    this.usuarioService.CambiarPassword(this.idUsuario, {
      passwordActual: this.form.passwordActual,
      passwordNueva: this.form.passwordNueva,
      claveNueva: this.form.claveNueva || undefined,
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Contraseña cambiada correctamente' });
        this.form = { passwordActual: '', passwordNueva: '', passwordConfirm: '', claveNueva: '' };
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.message });
        this.saving.set(false);
      },
    });
  }
}
