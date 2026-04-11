import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AsistenciaInterface } from '../models/Asistencias.model';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private apiUrl = 'http://localhost:4000/api/asistencia'; 

  constructor(private http: HttpClient) { }

  getAsistencias(): Observable<AsistenciaInterface[]> {
    return this.http.get<AsistenciaInterface[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  createAsistencia(asistencia: AsistenciaInterface): Observable<AsistenciaInterface> {
    return this.http.post<AsistenciaInterface>(`${this.apiUrl}/CrearAsistencia`, asistencia).pipe(catchError(this.handleError));
  }

  updateAsistencia(id: number, asistencia: AsistenciaInterface): Observable<AsistenciaInterface> {
    return this.http.patch<AsistenciaInterface>(`${this.apiUrl}/${id}`, asistencia).pipe(catchError(this.handleError));
  }

  deleteAsistencia(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => new Error('Error en el servidor'));
  }
}