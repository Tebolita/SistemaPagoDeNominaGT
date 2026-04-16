import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AsistenciaInterface } from '../models/Asistencias.model';
import { ErrorService } from './error.service';
@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private apiUrl = 'http://localhost:4000/api/asistencia'; 

  constructor(
    private http: HttpClient, 
          private errorService: ErrorService) { }

  getAsistencias(): Observable<AsistenciaInterface[]> {
    return this.http.get<AsistenciaInterface[]>(this.apiUrl).pipe(catchError(this.errorService.handleError));
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