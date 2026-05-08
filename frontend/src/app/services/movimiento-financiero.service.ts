import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { MovimientoFinanciero, BalanceInfo } from '../models/MovimientoFinanciero.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class MovimientoFinancieroService {
  private apiUrl = 'http://localhost:4000/api/movimiento-financiero';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<MovimientoFinanciero>): Observable<MovimientoFinanciero> {
    return this.http.post<MovimientoFinanciero>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(
    idCuenta?: number,
    tipoMovimiento?: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Observable<MovimientoFinanciero[]> {
    let params = new HttpParams();
    if (idCuenta) {
      params = params.set('idCuenta', idCuenta.toString());
    }
    if (tipoMovimiento) {
      params = params.set('tipoMovimiento', tipoMovimiento);
    }
    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<MovimientoFinanciero[]>(this.apiUrl, { params }).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getBalance(idCuenta: number): Observable<BalanceInfo> {
    return this.http.get<BalanceInfo>(`${this.apiUrl}/balance/${idCuenta}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<MovimientoFinanciero> {
    return this.http.get<MovimientoFinanciero>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<MovimientoFinanciero>): Observable<MovimientoFinanciero> {
    return this.http.patch<MovimientoFinanciero>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<MovimientoFinanciero> {
    return this.http.delete<MovimientoFinanciero>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
