import { Component } from '@angular/core';
import { MenuPrincipal } from '../menu/menu';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [MenuPrincipal, RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
