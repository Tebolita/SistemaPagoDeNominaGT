import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RolInterface } from '../models/Rol.model';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:4000/api/roles';

  getRoles(): Observable<RolInterface[]> {
    return this.http.get<RolInterface[]>(this.apiUrl);
  }

  getRol(id: number): Observable<RolInterface> {
    return this.http.get<RolInterface>(`${this.apiUrl}/${id}`);
  }

  createRol(rol: RolInterface): Observable<RolInterface> {
    return this.http.post<RolInterface>(this.apiUrl, rol);
  }

  updateRol(id: number, rol: Partial<RolInterface>): Observable<RolInterface> {
    return this.http.patch<RolInterface>(`${this.apiUrl}/${id}`, rol);
  }

  deleteRol(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}