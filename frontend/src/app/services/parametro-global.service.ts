import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParametroGlobal } from '../models/ParametroGlobal.model';

@Injectable({
  providedIn: 'root',
})
export class ParametroGlobalService {
  private apiUrl = 'http://localhost:4000/api/parametro-global';
  private http = inject(HttpClient);

  create(data: Partial<ParametroGlobal>): Observable<ParametroGlobal> {
    return this.http.post<ParametroGlobal>(this.apiUrl, data);
  }

  getAll(): Observable<ParametroGlobal[]> {
    return this.http.get<ParametroGlobal[]>(this.apiUrl);
  }

  getById(id: number): Observable<ParametroGlobal> {
    return this.http.get<ParametroGlobal>(`${this.apiUrl}/${id}`);
  }

  getByName(nombre: string): Observable<ParametroGlobal> {
    return this.http.get<ParametroGlobal>(`${this.apiUrl}/nombre/${nombre}`);
  }

  update(id: number, data: Partial<ParametroGlobal>): Observable<ParametroGlobal> {
    return this.http.patch<ParametroGlobal>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<ParametroGlobal> {
    return this.http.delete<ParametroGlobal>(`${this.apiUrl}/${id}`);
  }
}
