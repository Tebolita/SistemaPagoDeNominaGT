import { Cliente } from './Cliente.model';
import { ProductoServicio } from './ProductoServicio.model';

export interface VentaDetalle {
  IdDetalleVenta: number;
  IdVenta: number;
  IdProducto: number;
  Cantidad: number;
  PrecioUnitario: number;
  Descuento?: number;
  Subtotal: number;
  ProductoServicio: ProductoServicio;
}

export interface Venta {
  IdVenta: number;
  IdCliente?: number;
  FechaVenta: string;
  TipoVenta: 'CONTADO' | 'CREDITO';
  Subtotal: number;
  Descuento: number;
  Impuestos: number;
  Total: number;
  EstadoPago: 'PENDIENTE' | 'PAGADO' | 'CANCELADO' | 'VENCIDO';
  FechaVencimiento?: string;
  Notas?: string;
  Activo: boolean;
  Cliente?: Cliente;
  DetalleVenta: VentaDetalle[];
}
