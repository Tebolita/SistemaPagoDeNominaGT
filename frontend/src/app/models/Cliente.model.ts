export interface Cliente {
  IdCliente: number;
  NombreCliente: string;
  TipoCliente?: 'INDIVIDUAL' | 'EMPRESARIAL';
  NIT?: string;
  DPI?: string;
  Correo?: string;
  Telefono?: string;
  Direccion?: string;
  Activo: boolean;
  FechaEliminacion?: string;
}
