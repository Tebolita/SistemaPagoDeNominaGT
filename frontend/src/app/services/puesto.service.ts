import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Puesto } from '../models/Puesto.model';

@Injectable({
  providedIn: 'root',
})
export class PuestoService {
  private apiUrl = 'http://localhost:4000/api/puesto';
  private http = inject(HttpClient);

  create(data: Partial<Puesto>): Observable<Puesto> {
    return this.http.post<Puesto>(this.apiUrl, data);
  }

  getAll(): Observable<Puesto[]> {
    return this.http.get<Puesto[]>(this.apiUrl);
  }

  getById(id: number): Observable<Puesto> {
    return this.http.get<Puesto>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: Partial<Puesto>): Observable<Puesto> {
    return this.http.patch<Puesto>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<Puesto> {
    return this.http.delete<Puesto>(`${this.apiUrl}/${id}`);
  }
}
