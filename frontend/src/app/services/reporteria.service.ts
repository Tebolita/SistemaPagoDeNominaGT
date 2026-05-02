import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReporteriaService {
  apiUrl = 'http://localhost:4000/api/reporteria';

  constructor(private http: HttpClient) {}

  // ========== REPORTES DE EMPLEADOS ==========

  getReporteEmpleados(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    const params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    return this.http.get<any[]>(`${this.apiUrl}/empleados`, { params });
  }

  getReporteSalarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/salarios`);
  }

  getReporteDepartamentos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/departamentos`);
  }

  // ========== REPORTES DE NÓMINA ==========

  getReporteNomina(mes?: number, anio?: number): Observable<any[]> {
    const params: any = {};
    if (mes) params.mes = mes;
    if (anio) params.anio = anio;
    return this.http.get<any[]>(`${this.apiUrl}/nomina`, { params });
  }

  // ========== REPORTES DE ASISTENCIA ==========

  getReporteAsistencias(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asistencias`, {
      params: { fechaInicio, fechaFin }
    });
  }

  // ========== REPORTES DE VACACIONES ==========

  getReporteVacaciones(anio?: number): Observable<any[]> {
    const params: any = {};
    if (anio) params.anio = anio;
    return this.http.get<any[]>(`${this.apiUrl}/vacaciones`, { params });
  }

  // ========== RESUMEN EJECUTIVO ==========

  getResumenEjecutivo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen`);
  }
}