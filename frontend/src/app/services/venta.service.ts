import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Venta } from '../models/Venta.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class VentaService {
  private apiUrl = 'http://localhost:4000/api/venta';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: any): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(estadoPago?: string, idCliente?: number): Observable<Venta[]> {
    let params = new HttpParams();
    if (estadoPago) {
      params = params.set('estadoPago', estadoPago);
    }
    if (idCliente !== undefined && idCliente !== null) {
      params = params.set('idCliente', idCliente.toString());
    }

    return this.http.get<Venta[]>(this.apiUrl, { params }).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  updateEstadoPago(id: number, estadoPago: string): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}/${id}/estado-pago`, { estadoPago }).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
