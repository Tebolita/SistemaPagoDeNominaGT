export class CreateSalarioDto {
  IdEmpleado: number;
  SalarioBase: number;
  FechaInicioVigencia: string;
  FechaFinVigencia?: string;
}