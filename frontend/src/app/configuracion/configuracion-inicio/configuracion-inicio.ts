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
      status: 'coming',
      color: 'teal',
      features: [
        'Tasas de impuesto',
        'Límites salariales',
        'Configuración general'
      ]
    },
    {
      title: 'Estructuras Organizativas',
      description: 'Gestiona la jerarquía: departamentos, puestos, jornadas laborales y bancos.',
      icon: 'pi pi-sitemap',
      route: '/configuracion/estructura',
      status: 'coming',
      color: 'violet',
      features: [
        'Departamentos',
        'Puestos de trabajo',
        'Jornadas laborales'
      ]
    },
    {
      title: 'Moneda y Bancos',
      description: 'Configuración de monedas, tipo de cambio y datos de bancos para transferencias.',
      icon: 'pi pi-dollar',
      route: '/configuracion/bancos',
      status: 'coming',
      color: 'orange',
      features: [
        'Monedas vigentes',
        'Tipo de cambio',
        'Datos de bancos'
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
