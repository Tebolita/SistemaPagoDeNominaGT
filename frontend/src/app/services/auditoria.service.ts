import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { AuditoriaResponse, AuditoriaResumen } from '../models/Auditoria.model';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private apiUrl = 'http://localhost:4000/api/auditoria';
  private http   = inject(HttpClient);
  private errorService = inject(ErrorService);

  getAll(filters: {
    fechaDesde?: string;
    fechaHasta?: string;
    accion?: string;
    username?: string;
    exitoso?: string;
    page?: number;
    limit?: number;
  }): Observable<AuditoriaResponse> {
    let params = new HttpParams();
    if (filters.fechaDesde) params = params.set('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params = params.set('fechaHasta', filters.fechaHasta);
    if (filters.accion)     params = params.set('accion',     filters.accion);
    if (filters.username)   params = params.set('username',   filters.username);
    if (filters.exitoso !== undefined && filters.exitoso !== '') params = params.set('exitoso', filters.exitoso);
    if (filters.page)       params = params.set('page',       filters.page.toString());
    if (filters.limit)      params = params.set('limit',      filters.limit.toString());
    return this.http.get<AuditoriaResponse>(this.apiUrl, { params }).pipe(catchError(this.errorService.handleError));
  }

  getResumen(): Observable<AuditoriaResumen> {
    return this.http.get<AuditoriaResumen>(`${this.apiUrl}/resumen`).pipe(catchError(this.errorService.handleError));
  }
}
