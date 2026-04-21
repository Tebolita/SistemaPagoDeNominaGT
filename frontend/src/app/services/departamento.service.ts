import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Departamento } from '../models/Departamento.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class DepartamentoService {
  private apiUrl = 'http://localhost:4000/api/departamento';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<Departamento>): Observable<Departamento> {
    return this.http.post<Departamento>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<Departamento>): Observable<Departamento> {
    return this.http.patch<Departamento>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<Departamento> {
    return this.http.delete<Departamento>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
