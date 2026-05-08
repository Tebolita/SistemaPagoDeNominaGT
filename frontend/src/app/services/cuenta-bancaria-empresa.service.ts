import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { CuentaBancariaEmpresa } from '../models/CuentaBancariaEmpresa.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class CuentaBancariaEmpresaService {
  private apiUrl = 'http://localhost:4000/api/cuenta-bancaria-empresa';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  create(data: Partial<CuentaBancariaEmpresa>): Observable<CuentaBancariaEmpresa> {
    return this.http.post<CuentaBancariaEmpresa>(this.apiUrl, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getAll(activo?: boolean): Observable<CuentaBancariaEmpresa[]> {
    let params = new HttpParams();
    if (activo !== undefined) {
      params = params.set('activo', activo.toString());
    }

    return this.http.get<CuentaBancariaEmpresa[]>(this.apiUrl, { params }).pipe(
      catchError(this.errorService.handleError)
    );
  }

  getById(id: number): Observable<CuentaBancariaEmpresa> {
    return this.http.get<CuentaBancariaEmpresa>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  update(id: number, data: Partial<CuentaBancariaEmpresa>): Observable<CuentaBancariaEmpresa> {
    return this.http.patch<CuentaBancariaEmpresa>(`${this.apiUrl}/${id}`, data).pipe(
      catchError(this.errorService.handleError)
    );
  }

  updateSaldo(id: number, nuevoSaldo: number): Observable<CuentaBancariaEmpresa> {
    return this.http.patch<CuentaBancariaEmpresa>(`${this.apiUrl}/${id}/saldo`, { nuevoSaldo }).pipe(
      catchError(this.errorService.handleError)
    );
  }

  delete(id: number): Observable<CuentaBancariaEmpresa> {
    return this.http.delete<CuentaBancariaEmpresa>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.errorService.handleError)
    );
  }

  reactivate(id: number): Observable<CuentaBancariaEmpresa> {
    return this.http.patch<CuentaBancariaEmpresa>(`${this.apiUrl}/${id}/reactivate`, {}).pipe(
      catchError(this.errorService.handleError)
    );
  }
}
