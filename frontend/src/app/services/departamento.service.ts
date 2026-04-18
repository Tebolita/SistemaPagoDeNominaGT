import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Departamento } from '../models/Departamento.model';

@Injectable({
  providedIn: 'root',
})
export class DepartamentoService {
  private apiUrl = 'http://localhost:4000/api/departamento';
  private http = inject(HttpClient);

  create(data: Partial<Departamento>): Observable<Departamento> {
    return this.http.post<Departamento>(this.apiUrl, data);
  }

  getAll(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.apiUrl);
  }

  getById(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: Partial<Departamento>): Observable<Departamento> {
    return this.http.patch<Departamento>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<Departamento> {
    return this.http.delete<Departamento>(`${this.apiUrl}/${id}`);
  }
}
