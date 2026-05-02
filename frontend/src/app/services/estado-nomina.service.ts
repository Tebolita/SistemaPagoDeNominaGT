import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { EstadoNomina, HistorialEstadoNomina, CambiarEstadoNominaDto } from '../models/EstadoNomina.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class EstadoNominaService {
  private apiUrl = 'http://localhost:4000/api/estado-nomina';

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) {}

  // CRUD básico para estados
  getAll(): Observable<EstadoNomina[]> {
    return this.http.get<EstadoNomina[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<EstadoNomina> {
    return this.http.get<EstadoNomina>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  create(data: Partial<EstadoNomina>): Observable<EstadoNomina> {
    return this.http.post<EstadoNomina>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<EstadoNomina>): Observable<EstadoNomina> {
    return this.http.patch<EstadoNomina>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<EstadoNomina> {
    return this.http.delete<EstadoNomina>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  // Métodos específicos para flujo de estados
  cambiarEstado(data: CambiarEstadoNominaDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/cambiar-estado`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getHistorial(idNomina: number): Observable<HistorialEstadoNomina[]> {
    return this.http.get<HistorialEstadoNomina[]>(`${this.apiUrl}/historial/${idNomina}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getEstadosDisponibles(idNomina: number): Observable<EstadoNomina[]> {
    return this.http.get<EstadoNomina[]>(`${this.apiUrl}/disponibles/${idNomina}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}