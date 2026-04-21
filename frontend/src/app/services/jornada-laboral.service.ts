import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { JornadaLaboral } from '../models/JornadaLaboral.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class JornadaLaboralService {
  private apiUrl = 'http://localhost:4000/api/jornada-laboral';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<JornadaLaboral>): Observable<JornadaLaboral> {
    return this.http.post<JornadaLaboral>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(): Observable<JornadaLaboral[]> {
    return this.http.get<JornadaLaboral[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<JornadaLaboral> {
    return this.http.get<JornadaLaboral>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<JornadaLaboral>): Observable<JornadaLaboral> {
    return this.http.patch<JornadaLaboral>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<JornadaLaboral> {
    return this.http.delete<JornadaLaboral>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
