export interface IncidenciaVacacion {
    IdIncidencia?: number;
    IdEmpleado: number;
    TipoIncidencia: string;
    FechaInicio: Date | string;
    FechaFin: Date | string;
    ConGoceSueldo: boolean;
    IdUsuarioAutoriza: number;
    Empleado?: {
        IdEmpleado: number;
        Nombres: string;
        Apellidos: string;
        Puesto?: {
            NombrePuesto: string;
            Departamento?: {
                NombreDepartamento: string;
            };
        };
    };
    Usuario?: {
        Username: string;
    };
    DetalleControlVacacion?: DetalleControlVacacion[];
}

export interface DetalleControlVacacion {
    IdDetalleVacacion: number;
    IdControlVacacion: number;
    IdIncidencia: number;
    DiasDescontados: number;
    FechaRegistro: Date | string;
    ControlVacacion?: {
        IdControlVacacion: number;
        AnioCorriente: number;
        DiasGanados: number;
        DiasGozados: number;
    };
}

export interface ControlVacacion {
    IdControlVacacion: number;
    IdEmpleado: number;
    AnioCorriente: number;
    DiasGanados: number;
    DiasGozados: number;
    Activo: boolean;
}