import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { CommonModule } from '@angular/common';
 
interface ModuleCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  status: 'active' | 'coming';
  color: string;
  features: string[];
}
 
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterModule, ButtonModule, CardModule, BadgeModule, RippleModule, CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
 
  constructor(private router: Router) {}
 
  modules: ModuleCard[] = [
    {
      title: 'Empleados',
      description: 'Gestión completa del personal: altas, bajas, modificaciones y consulta de información.',
      icon: 'pi pi-users',
      route: '/home/empleado',
      status: 'active',
      color: 'blue',
      features: ['Registro de empleados', 'Gestión de puestos', 'Historial salarial']
    },
    {
      title: 'Vacaciones',
      description: 'Control de días de vacaciones ganados, gozados y saldo disponible por empleado.',
      icon: 'pi pi-calendar',
      route: '/home/vacacion',
      status: 'active',
      color: 'teal',
      features: ['Días ganados', 'Días gozados', 'Saldo disponible']
    },
    {
      title: 'Asistencias',
      description: 'Registro y control de entradas, salidas y horas extras del personal.',
      icon: 'pi pi-clock',
      route: '/home/asistencia',
      status: 'active',
      color: 'violet',
      features: ['Hora de entrada', 'Hora de salida', 'Horas extra']
    }
  ];
 
  navigate(route: string) {
    this.router.navigate([route]);
  }
}