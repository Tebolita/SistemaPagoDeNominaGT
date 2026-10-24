import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { IncidenciaVacacion } from '../models/Vacacion.model';
import { ErrorService } from '../services/error.service';
import { environment } from '../../environments/environment';

// Aquí define la URL de tu API
const API_URL = `${environment.apiUrl}/incidencia`; 
const API_CONTROL_URL = `${environment.apiUrl}/control-vacacion`;

// Saldo calculado por el backend según la antigüedad del empleado
export interface SaldoVacaciones {
  fechaIngreso: string;
  aniosServicio: number;
  diasGanados: number;
  diasGozados: number;
  diasDisponibles: number;
  proximoAniversario: string;
}

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {

  constructor(
    private http: HttpClient, 
    private errorService: ErrorService
  ) { }

  // Obtiene las vacaciones desde el endpoint especializado que combina 
  // Incidencia + ControlVacacion + DetalleControlVacacion
  getVacaciones(): Observable<IncidenciaVacacion[]> {
    return this.http.get<IncidenciaVacacion[]>(`${API_URL}/vacaciones`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  createVacacion(vacacion: IncidenciaVacacion): Observable<IncidenciaVacacion> {
    return this.http.post<IncidenciaVacacion>(`${API_URL}/CrearIncidencia`, vacacion).pipe(
      catchError(this.errorService.handleError)
    );
  }

  updateVacacion(id: number, vacacion: IncidenciaVacacion): Observable<IncidenciaVacacion> {
    return this.http.patch<IncidenciaVacacion>(`${API_URL}/${id}`, vacacion).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getSaldo(idEmpleado: number): Observable<SaldoVacaciones> {
    return this.http.get<SaldoVacaciones>(`${API_CONTROL_URL}/saldo/${idEmpleado}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  deleteVacacion(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}