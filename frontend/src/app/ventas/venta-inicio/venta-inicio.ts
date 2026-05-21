import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface ModuleCard {
  title: string; description: string; icon: string;
  route: string; status: 'active' | 'coming'; color: string; features: string[];
}

@Component({
  selector: 'app-venta-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './venta-inicio.html',
  styleUrl: './venta-inicio.css',
})
export class VentaInicioComponent {
  constructor(private router: Router) {}

  modules: ModuleCard[] = [
    {
      title: 'Clientes',
      description: 'Administra el registro de clientes individuales y empresariales con sus datos de contacto.',
      icon: 'pi pi-users', route: '/ventas/clientes', status: 'active', color: 'blue',
      features: ['Clientes individuales y empresas', 'NIT y DPI', 'Historial de contacto'],
    },
    {
      title: 'Productos / Servicios',
      description: 'Gestiona el catálogo de productos y servicios disponibles para facturación.',
      icon: 'pi pi-box', route: '/ventas/productos', status: 'active', color: 'teal',
      features: ['Catálogo de productos', 'Precios y costos', 'Tipos PRODUCTO / SERVICIO'],
    },
    {
      title: 'Ventas',
      description: 'Crea y administra órdenes de venta con detalle de facturación e IVA automático.',
      icon: 'pi pi-shopping-cart', route: '/ventas/ventas', status: 'active', color: 'violet',
      features: ['Órdenes de venta', 'IVA automático', 'Estados de pago'],
    },
  ];

  navigate(route: string) { this.router.navigate([route]); }
}
