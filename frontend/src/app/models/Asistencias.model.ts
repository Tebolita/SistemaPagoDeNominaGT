export interface AsistenciaInterface {
    IdAsistencia?: number;
    IdEmpleado: number;
    Fecha: Date | string;
    HoraEntrada: Date | string;
    HoraSalida: Date | string | null;
    HorasExtra: number;
    Empleado?: any; // Para mostrar los datos relacionales en la tabla
}