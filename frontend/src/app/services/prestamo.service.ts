import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorService } from './error.service';

export interface Prestamo {
  IdPrestamo: number;
  IdEmpleado: number;
  MontoPrestamo: number;
  CuotaMensual: number;
  TotalCuotas: number;
  CuotasPagadas: number;
  Descripcion?: string;
  FechaAprobacion: string;
  Estado: string;
  SaldoPendiente: number;
  Empleado: { Nombres: string; Apellidos: string; IdEmpleado: number };
  CuotaPrestamo: Cuota[];
}

export interface Cuota {
  IdCuota: number;
  IdPrestamo: number;
  NumeroCuota: number;
  MontoCuota: number;
  FechaPago?: string;
  Estado: string;
}

@Injectable({ providedIn: 'root' })
export class PrestamoService {
  private apiUrl = 'http://localhost:4000/api/prestamo';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  getAll(idEmpleado?: number): Observable<Prestamo[]> {
    let params = new HttpParams();
    if (idEmpleado) params = params.set('idEmpleado', idEmpleado.toString());
    return this.http.get<Prestamo[]>(this.apiUrl, { params }).pipe(catchError(this.errorService.handleError));
  }

  create(dto: { idEmpleado: number; montoPrestamo: number; totalCuotas: number; fechaAprobacion: string; descripcion?: string }): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.apiUrl, dto).pipe(catchError(this.errorService.handleError));
  }

  pagarCuota(idCuota: number): Observable<Prestamo> {
    return this.http.patch<Prestamo>(`${this.apiUrl}/cuota/${idCuota}/pagar`, {}).pipe(catchError(this.errorService.handleError));
  }

  cancelar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(catchError(this.errorService.handleError));
  }
}
