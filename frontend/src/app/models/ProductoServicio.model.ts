export interface ProductoServicio {
  IdProducto: number;
  NombreProducto: string;
  TipoProducto?: 'PRODUCTO' | 'SERVICIO';
  PrecioUnitario: number;
  CostoUnitario?: number;
  UnidadMedida?: string;
  Activo: boolean;
  FechaEliminacion?: string;
}
