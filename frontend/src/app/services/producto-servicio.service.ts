import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ProductoServicio } from '../models/ProductoServicio.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class ProductoServicioService {
  private apiUrl = 'http://localhost:4000/api/producto-servicio';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<ProductoServicio>): Observable<ProductoServicio> {
    return this.http.post<ProductoServicio>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(): Observable<ProductoServicio[]> {
    return this.http.get<ProductoServicio[]>(this.apiUrl).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<ProductoServicio> {
    return this.http.get<ProductoServicio>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<ProductoServicio>): Observable<ProductoServicio> {
    return this.http.patch<ProductoServicio>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<ProductoServicio> {
    return this.http.delete<ProductoServicio>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
