import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Banco } from '../models/Banco.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class BancoService {
  private apiUrl = 'http://localhost:4000/api/banco';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<Banco>): Observable<Banco> {
    return this.http.post<Banco>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(): Observable<Banco[]> {
    return this.http.get<Banco[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<Banco>): Observable<Banco> {
    return this.http.patch<Banco>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<Banco> {
    return this.http.delete<Banco>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
