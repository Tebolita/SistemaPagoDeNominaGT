import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuPrincipal } from './menu-principal/menu-principal';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MenuPrincipal],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('sistema_pago_de_nomina');
}
