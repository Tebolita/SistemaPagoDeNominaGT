export interface IncidenciaVacacion {
    IdIncidencia?: number;
    IdEmpleado: number;
    TipoIncidencia: string;
    FechaInicio: Date | string;
    FechaFin: Date | string;
    ConGoceSueldo: boolean;
    IdUsuarioAutoriza: number;
    Empleado?: any; // Para mostrar el nombre en la tabla
}