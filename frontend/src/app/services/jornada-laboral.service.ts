import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JornadaLaboral } from '../models/JornadaLaboral.model';

@Injectable({
  providedIn: 'root',
})
export class JornadaLaboralService {
  private apiUrl = 'http://localhost:4000/api/jornada-laboral';
  private http = inject(HttpClient);

  create(data: Partial<JornadaLaboral>): Observable<JornadaLaboral> {
    return this.http.post<JornadaLaboral>(this.apiUrl, data);
  }

  getAll(): Observable<JornadaLaboral[]> {
    return this.http.get<JornadaLaboral[]>(this.apiUrl);
  }

  getById(id: number): Observable<JornadaLaboral> {
    return this.http.get<JornadaLaboral>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: Partial<JornadaLaboral>): Observable<JornadaLaboral> {
    return this.http.patch<JornadaLaboral>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<JornadaLaboral> {
    return this.http.delete<JornadaLaboral>(`${this.apiUrl}/${id}`);
  }
}
