import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Banco } from '../models/Banco.model';

@Injectable({
  providedIn: 'root',
})
export class BancoService {
  private apiUrl = 'http://localhost:4000/api/banco';
  private http = inject(HttpClient);

  create(data: Partial<Banco>): Observable<Banco> {
    return this.http.post<Banco>(this.apiUrl, data);
  }

  getAll(): Observable<Banco[]> {
    return this.http.get<Banco[]>(this.apiUrl);
  }

  getById(id: number): Observable<Banco> {
    return this.http.get<Banco>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: Partial<Banco>): Observable<Banco> {
    return this.http.patch<Banco>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<Banco> {
    return this.http.delete<Banco>(`${this.apiUrl}/${id}`);
  }
}
