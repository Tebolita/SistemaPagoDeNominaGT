export interface EstadoNomina {
  IdEstadoNomina: number;
  NombreEstado: string;
  Descripcion?: string;
  Orden: number;
  RequiereAprobacion?: boolean;
  Activo?: boolean;
  FechaEliminacion?: Date;
}

export interface HistorialEstadoNomina {
  IdHistorial: number;
  IdNomina: number;
  IdEstadoAnterior?: number;
  IdEstadoNuevo: number;
  IdUsuarioCambio: number;
  FechaCambio?: Date;
  Comentarios?: string;
  Activo?: boolean;
  FechaEliminacion?: Date;
  EstadoNomina_HistorialEstadoNomina_IdEstadoAnteriorToEstadoNomina?: {
    NombreEstado: string;
  };
  EstadoNomina_HistorialEstadoNomina_IdEstadoNuevoToEstadoNomina: {
    NombreEstado: string;
  };
  Usuario: {
    Username: string;
  };
}

export interface CambiarEstadoNominaDto {
  IdNomina: number;
  IdEstadoNuevo: number;
  Comentarios?: string;
}