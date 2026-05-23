import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ConfigFirmanteNomina } from '../models/ConfigFirmante.model';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class ConfigFirmanteService {
  private apiUrl = 'http://localhost:4000/api/config-firmante';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  getAll(): Observable<ConfigFirmanteNomina[]> {
    return this.http.get<ConfigFirmanteNomina[]>(this.apiUrl).pipe(catchError(this.errorService.handleError));
  }

  create(data: Partial<ConfigFirmanteNomina>): Observable<ConfigFirmanteNomina> {
    return this.http.post<ConfigFirmanteNomina>(this.apiUrl, data).pipe(catchError(this.errorService.handleError));
  }

  update(id: number, data: Partial<ConfigFirmanteNomina>): Observable<ConfigFirmanteNomina> {
    return this.http.patch<ConfigFirmanteNomina>(`${this.apiUrl}/${id}`, data).pipe(catchError(this.errorService.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.errorService.handleError));
  }
}
