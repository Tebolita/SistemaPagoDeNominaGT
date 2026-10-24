import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AsistenciaInterface } from '../models/Asistencias.model';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private apiUrl = `${environment.apiUrl}/asistencia`; 

  constructor(
    private http: HttpClient, 
          private errorService: ErrorService) { }

  getAsistencias(): Observable<AsistenciaInterface[]> {
    return this.http.get<AsistenciaInterface[]>(this.apiUrl).pipe(catchError(this.errorService.handleError));
  }

  // Página del listado (el servidor ordena del registro más reciente al más antiguo)
  getAsistenciasPaginadas(page: number, limit: number): Observable<{ total: number; page: number; limit: number; registros: AsistenciaInterface[] }> {
    return this.http
      .get<{ total: number; page: number; limit: number; registros: AsistenciaInterface[] }>(this.apiUrl, { params: { page, limit } })
      .pipe(catchError(this.errorService.handleError));
  }

  createAsistencia(asistencia: AsistenciaInterface): Observable<AsistenciaInterface> {
    return this.http.post<AsistenciaInterface>(`${this.apiUrl}/CrearAsistencia`, asistencia).pipe(catchError(this.errorService.handleError));
  }

  updateAsistencia(id: number, asistencia: AsistenciaInterface): Observable<AsistenciaInterface> {
    return this.http.patch<AsistenciaInterface>(`${this.apiUrl}/${id}`, asistencia).pipe(catchError(this.errorService.handleError));
  }

  deleteAsistencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(catchError(this.errorService.handleError));
  }

}