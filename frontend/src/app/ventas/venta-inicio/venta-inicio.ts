import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-venta-inicio',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  templateUrl: './venta-inicio.html',
  styleUrl: './venta-inicio.css'
})
export class VentaInicioComponent {}
