import { Component, inject } from '@angular/core';
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
  selector: 'app-configuracion-inicio',
  standalone: true,
  imports: [RouterModule, ButtonModule, CardModule, BadgeModule, RippleModule, CommonModule],
  templateUrl: './configuracion-inicio.html',
  styleUrl: './configuracion-inicio.css',
})
export class ConfiguracionInicio {
  private router = inject(Router);

  modules: ModuleCard[] = [
    {
      title: 'Estados de Nómina',
      description: 'Administra los estados del flujo de nómina: GENERADA, PENDIENTE, APROBADA, PROCESADA.',
      icon: 'pi pi-tags',
      route: '/configuracion/estados-nomina',
      status: 'active',
      color: 'blue',
      features: [
        'Crear estados',
        'Validar transiciones',
        'Ver historial'
      ]
    },
    {
      title: 'Parámetros Globales',
      description: 'Configura parámetros generales del sistema como tasas, límites e impuestos.',
      icon: 'pi pi-sliders-h',
      route: '/configuracion/parametros',
      status: 'active',
      color: 'teal',
      features: [
        'Tasas de impuesto',
        'Límites salariales',
        'Configuración general'
      ]
    },
    {
      title: 'Departamentos',
      description: 'Gestiona la estructura departamental de la organización.',
      icon: 'pi pi-building',
      route: '/configuracion/departamentos',
      status: 'active',
      color: 'violet',
      features: [
        'Crear departamentos',
        'Jerarquía organizacional',
        'Asignación de empleados'
      ]
    },
    {
      title: 'Puestos de Trabajo',
      description: 'Administra los diferentes puestos y roles dentro de la empresa.',
      icon: 'pi pi-briefcase',
      route: '/configuracion/puestos',
      status: 'active',
      color: 'orange',
      features: [
        'Definir puestos',
        'Salarios por puesto',
        'Requisitos del cargo'
      ]
    },
    {
      title: 'Jornadas Laborales',
      description: 'Configura las diferentes jornadas de trabajo disponibles.',
      icon: 'pi pi-calendar',
      route: '/configuracion/jornadas',
      status: 'active',
      color: 'green',
      features: [
        'Horarios de trabajo',
        'Días laborables',
        'Horas semanales'
      ]
    },
    {
      title: 'Bancos',
      description: 'Gestiona la información de bancos para transferencias y pagos.',
      icon: 'pi pi-money-bill',
      route: '/configuracion/bancos',
      status: 'active',
      color: 'red',
      features: [
        'Datos bancarios',
        'Cuentas de empresa',
        'Transferencias'
      ]
    }
  ];

  navigate(route: string) {
    const modulo = this.modules.find(m => m.route === route);
    if (modulo && modulo.status === 'active') {
      this.router.navigate([route]);
    }
  }
}
