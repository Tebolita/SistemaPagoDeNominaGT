import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-finanzas-inicio',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  templateUrl: './finanzas-inicio.html',
  styleUrl: './finanzas-inicio.css'
})
export class FinanzasInicioComponent {}
