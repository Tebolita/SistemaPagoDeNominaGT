import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class CorreoService {
  private apiUrl = 'http://localhost:4000/api/correo';
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  enviarBoletaNomina(idNomina: number): Observable<{ enviados: number; destinatarios: string[] }> {
    return this.http
      .post<{ enviados: number; destinatarios: string[] }>(`${this.apiUrl}/boleta-nomina`, { IdNomina: idNomina })
      .pipe(catchError(this.errorService.handleError));
  }

  enviarFacturaVenta(idVenta: number): Observable<{ enviado: boolean; destinatario: string }> {
    return this.http
      .post<{ enviado: boolean; destinatario: string }>(`${this.apiUrl}/factura-venta`, { IdVenta: idVenta })
      .pipe(catchError(this.errorService.handleError));
  }

  enviarNotificacion(destinatarios: string[], asunto: string, mensaje: string): Observable<{ enviados: number }> {
    return this.http
      .post<{ enviados: number }>(`${this.apiUrl}/notificacion`, { Destinatarios: destinatarios, Asunto: asunto, Mensaje: mensaje })
      .pipe(catchError(this.errorService.handleError));
  }
}
