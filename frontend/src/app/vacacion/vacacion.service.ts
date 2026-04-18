import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { IncidenciaVacacion } from '../models/Vacacion.model';
import { ErrorService } from '../services/error.service';

// Aquí define la URL de tu API
const API_URL = 'http://localhost:4000/api/incidencia'; 

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {

  constructor(
    private http: HttpClient, 
    private errorService: ErrorService
  ) { }

  // Filtrar en el frontend o backend para mostrar solo 'Vacaciones'
  getVacaciones(): Observable<IncidenciaVacacion[]> {
    return this.http.get<IncidenciaVacacion[]>(API_URL).pipe(
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

  deleteVacacion(id: number): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}