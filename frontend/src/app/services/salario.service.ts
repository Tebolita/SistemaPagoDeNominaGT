import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalarioResponse, SalarioRequest, SalarioResponseCUD } from '../models/Salario.model';

@Injectable({
  providedIn: 'root',
})
export class SalarioService {
  private http = inject(HttpClient);
  private apiUrl =  'http://localhost:4000/api/salario';

  create(data: SalarioRequest): Observable<SalarioResponseCUD> {
    return this.http.post<SalarioResponseCUD>(this.apiUrl, data);
  }

  findAll(): Observable<SalarioResponse[]> {
    return this.http.get<SalarioResponse[]>(this.apiUrl);
  }

  findByEmpleado(idEmpleado: number): Observable<SalarioResponse[]> {
    return this.http.get<SalarioResponse[]>(`${this.apiUrl}/empleado/${idEmpleado}`);
  }

  findOne(id: number): Observable<SalarioResponse> {
    return this.http.get<SalarioResponse>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: Partial<SalarioRequest>): Observable<SalarioResponseCUD> {
    return this.http.patch<SalarioResponseCUD>(`${this.apiUrl}/${id}`, data);
  }

  remove(id: number): Observable<SalarioResponseCUD> {
    return this.http.delete<SalarioResponseCUD>(`${this.apiUrl}/${id}`);
  }

  getSalarioActivo(idEmpleado: number): Observable<SalarioResponse | null> {
    return this.http.get<SalarioResponse | null>(`${this.apiUrl}/activo/${idEmpleado}`);
  }
}