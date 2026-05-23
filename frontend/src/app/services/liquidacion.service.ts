import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorService } from './error.service';

export interface LiquidacionCalculo {
  idEmpleado: number;
  empleado: string;
  salarioBase: number;
  fechaIngreso: string;
  fechaLiquidacion: string;
  aniosServicio: number;
  motivoSalida?: string;
  indemnizacion: number;
  vacacionesPendientes: number;
  aguinaldoProporcional: number;
  bono14Proporcional: number;
  totalLiquidacion: number;
  observaciones?: string;
}

export interface Liquidacion extends LiquidacionCalculo {
  IdLiquidacion: number;
  Estado: string;
  Empleado: { Nombres: string; Apellidos: string };
}

@Injectable({ providedIn: 'root' })
export class LiquidacionService {
  private apiUrl = 'http://localhost:4000/api/liquidacion';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  calcular(dto: { idEmpleado: number; fechaLiquidacion: string; motivoSalida?: string; diasVacacionesPendientes?: number; observaciones?: string }): Observable<LiquidacionCalculo> {
    return this.http.post<LiquidacionCalculo>(`${this.apiUrl}/calcular`, dto).pipe(catchError(this.errorService.handleError));
  }

  crear(dto: any): Observable<Liquidacion> {
    return this.http.post<Liquidacion>(this.apiUrl, dto).pipe(catchError(this.errorService.handleError));
  }

  getAll(): Observable<Liquidacion[]> {
    return this.http.get<Liquidacion[]>(this.apiUrl).pipe(catchError(this.errorService.handleError));
  }

  pagar(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/pagar`, {}).pipe(catchError(this.errorService.handleError));
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(catchError(this.errorService.handleError));
  }
}
