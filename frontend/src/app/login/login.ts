import { Component, OnInit,ChangeDetectorRef, signal, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule, formatDate } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LoginService } from '../services/login.service';
import { LoginRequest, LoginResponse } from '../models/login.model';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    InputTextModule,
    FormsModule,
    PasswordModule,
    ButtonModule,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule,
    PasswordModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  saludo = signal('');
  horaActual = signal('');
  loading = signal(false);
  errorMsg = signal('');
  datos = {
    Username: '',
    Contrasena: '',
    Clave: ''
  };

  private authService = inject(LoginService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(){
    this.actualizarSaludo()
  }

  actualizarSaludo(){
    const fecha = new Date();
    const hora = fecha.getHours();
    this.horaActual.set(formatDate(fecha, "dd-MM-yyyy", "en-es"))
    if (hora >= 6 && hora < 12) {
      this.saludo.set('¡Buenos días!');
    } else if (hora >= 12 && hora < 20) {
      this.saludo.set('¡Buenas tardes!');
    } else {
      this.saludo.set('¡Buenas noches!');
    }
  }

  onIngresar(): void {
    if (!this.datos.Username || !this.datos.Contrasena || !this.datos.Clave) {
      this.errorMsg.set('Todos los campos son requeridos');
      return;
    }

    const payload: LoginRequest = {
      Username: this.datos.Username,
      Contrasena: this.datos.Contrasena,
      Clave: Number(this.datos.Clave),
    };

    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.signIn(payload).subscribe({
      next: (res: LoginResponse) => {
          localStorage.setItem('access_token', res.access_token);
          this.router.navigate(['/home/inicio']);
      },
      error: (err) => {
        this.errorMsg.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
