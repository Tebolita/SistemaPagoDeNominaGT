import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorService } from './error.service';

export interface ConfigEmpresa {
  IdConfig?: number;
  NombreEmpresa: string;
  NIT: string;
  Direccion?: string;
  Telefono?: string;
  CorreoEmpresa?: string;
  RegimenFiscal?: string;
  Logo?: string;
  FechaActualizacion?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigEmpresaService {
  private apiUrl = 'http://localhost:4000/api/config-empresa';
  private http   = inject(HttpClient);
  private errorService = inject(ErrorService);

  get(): Observable<ConfigEmpresa | null> {
    return this.http.get<ConfigEmpresa | null>(this.apiUrl).pipe(catchError(this.errorService.handleError));
  }

  upsert(data: ConfigEmpresa): Observable<ConfigEmpresa> {
    return this.http.put<ConfigEmpresa>(this.apiUrl, data).pipe(catchError(this.errorService.handleError));
  }
}
