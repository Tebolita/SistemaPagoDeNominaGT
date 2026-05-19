import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { FirmaNomina, Nomina, NominaCalculo, NominaMasivaResultado } from '../models/Nomina.model';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root',
})
export class NominaService {
  private apiUrl = 'http://localhost:4000/api/nomina';

  constructor(
    private http: HttpClient,
    private errorService: ErrorService,
  ) {}

  calcular(idEmpleado: number, salarioBase: number): Observable<NominaCalculo> {
    return this.http
      .post<NominaCalculo>(`${this.apiUrl}/calcular`, { idEmpleado, salarioBase })
      .pipe(catchError(this.errorService.handleError));
  }

  generar(idEmpleado: number, salarioBase: number, mes?: number, anio?: number): Observable<Nomina> {
    return this.http
      .post<Nomina>(`${this.apiUrl}/generar`, { idEmpleado, salarioBase, mes, anio })
      .pipe(catchError(this.errorService.handleError));
  }

  getAll(): Observable<Nomina[]> {
    return this.http
      .get<Nomina[]>(this.apiUrl)
      .pipe(catchError(this.errorService.handleError));
  }

  getById(id: number): Observable<Nomina> {
    return this.http
      .get<Nomina>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.errorService.handleError));
  }

  update(id: number, data: Partial<Nomina>): Observable<Nomina> {
    return this.http
      .patch<Nomina>(`${this.apiUrl}/${id}`, data)
      .pipe(catchError(this.errorService.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.errorService.handleError));
  }

  getParametros(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/parametros`)
      .pipe(catchError(this.errorService.handleError));
  }

  generarMasiva(mes?: number, anio?: number): Observable<NominaMasivaResultado> {
    return this.http
      .post<NominaMasivaResultado>(`${this.apiUrl}/generar-masiva`, { mes, anio })
      .pipe(catchError(this.errorService.handleError));
  }

  firmar(idNomina: number, tipoFirmante: string, comentarios?: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${idNomina}/firmar`, { tipoFirmante, comentarios })
      .pipe(catchError(this.errorService.handleError));
  }

  getFirmas(idNomina: number): Observable<FirmaNomina[]> {
    return this.http
      .get<FirmaNomina[]>(`${this.apiUrl}/${idNomina}/firmas`)
      .pipe(catchError(this.errorService.handleError));
  }
}
