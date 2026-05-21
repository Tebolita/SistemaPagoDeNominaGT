import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ParametroGlobal } from '../models/ParametroGlobal.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class ParametroGlobalService {
  private apiUrl = 'http://localhost:4000/api/parametro-global';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<ParametroGlobal>): Observable<ParametroGlobal> {
    return this.http.post<ParametroGlobal>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(): Observable<ParametroGlobal[]> {
    return this.http.get<ParametroGlobal[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<ParametroGlobal> {
    return this.http.get<ParametroGlobal>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getByName(nombre: string): Observable<ParametroGlobal> {
    return this.http.get<ParametroGlobal>(`${this.apiUrl}/nombre/${nombre}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<ParametroGlobal>): Observable<ParametroGlobal> {
    return this.http.patch<ParametroGlobal>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<ParametroGlobal> {
    return this.http.delete<ParametroGlobal>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  simular(body: {
    IdParametro: number | null;
    Genero?: boolean | null;
    IdDepartamento?: number | null;
    IdPuesto?: number | null;
    IdJornada?: number | null;
  }): Observable<any> {
    const payload: any = { IdParametro: body.IdParametro };
    if (body.Genero !== null && body.Genero !== undefined) payload.Genero = body.Genero;
    if (body.IdDepartamento) payload.IdDepartamento = body.IdDepartamento;
    if (body.IdPuesto)       payload.IdPuesto       = body.IdPuesto;
    if (body.IdJornada)      payload.IdJornada       = body.IdJornada;
    return this.http.post<any>(`${this.apiUrl}/simular`, payload).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
