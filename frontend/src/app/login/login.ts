import { Component, OnDestroy, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CommonModule, formatDate } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, OnDestroy {
  saludo: string  = '';
  horaActual: string = ''
  private intervalo: any;

  ngOnInit(){
    this.actualizarSaludo()

    this.intervalo = setInterval(() => {
      this.actualizarSaludo();
    }, 60000)
  }

  actualizarSaludo(){
    const fecha = new Date();
    const hora = fecha.getHours();
    this.horaActual = formatDate(fecha, "dd-MM-yyyy", "en-es")
    if (hora >= 6 && hora < 12) {
      this.saludo = '¡Buenos días!';
    } else if (hora >= 12 && hora < 20) {
      this.saludo = '¡Buenas tardes!';
    } else {
      this.saludo = '¡Buenas noches!';
    }
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }
}
