import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Puesto } from '../models/Puesto.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class PuestoService {
  private apiUrl = 'http://localhost:4000/api/puesto';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<Puesto>): Observable<Puesto> {
    return this.http.post<Puesto>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(): Observable<Puesto[]> {
    return this.http.get<Puesto[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<Puesto> {
    return this.http.get<Puesto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<Puesto>): Observable<Puesto> {
    return this.http.patch<Puesto>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<Puesto> {
    return this.http.delete<Puesto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
