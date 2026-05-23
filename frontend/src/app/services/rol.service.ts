import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { RolInterface, Permiso, PermisosAgrupados } from '../models/Rol.model';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class RolService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);
  private apiUrl = 'http://localhost:4000/api/roles';

  getRoles(): Observable<RolInterface[]> {
    return this.http.get<RolInterface[]>(this.apiUrl).pipe(catchError(this.errorService.handleError));
  }

  getRol(id: number): Observable<RolInterface> {
    return this.http.get<RolInterface>(`${this.apiUrl}/${id}`).pipe(catchError(this.errorService.handleError));
  }

  createRol(rol: RolInterface): Observable<RolInterface> {
    return this.http.post<RolInterface>(this.apiUrl, rol).pipe(catchError(this.errorService.handleError));
  }

  updateRol(id: number, rol: Partial<RolInterface>): Observable<RolInterface> {
    return this.http.patch<RolInterface>(`${this.apiUrl}/${id}`, rol).pipe(catchError(this.errorService.handleError));
  }

  deleteRol(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(catchError(this.errorService.handleError));
  }

  // ── Permisos ──────────────────────────────────────────────────────
  getCatalogoPermisos(): Observable<PermisosAgrupados> {
    return this.http.get<PermisosAgrupados>(`${this.apiUrl}/permisos`).pipe(catchError(this.errorService.handleError));
  }

  getPermisosRol(idRol: number): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}/${idRol}/permisos`).pipe(catchError(this.errorService.handleError));
  }

  asignarPermisos(idRol: number, idPermisos: number[]): Observable<Permiso[]> {
    return this.http.put<Permiso[]>(`${this.apiUrl}/${idRol}/permisos`, { idPermisos }).pipe(catchError(this.errorService.handleError));
  }
}
