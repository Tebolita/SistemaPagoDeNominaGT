import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class ErrorService {
  public handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado en el servidor';

    if (error.error instanceof ErrorEvent) {
    // Ocurrió un error del lado del cliente (ej. se cortó el internet)
    errorMessage = error.error.message;
    } else {
        // El backend de NestJS rechazó la petición (ej. error 401, 404, 500)
        
        if (error.error && error.error.message) {
            // NestJS guarda el mensaje aquí. 
            // A veces es un array (si falla el class-validator) y a veces un string.
            errorMessage = Array.isArray(error.error.message) 
            ? error.error.message[0] 
            : error.error.message;
        } else {
            // Si el backend se cae por completo y no manda formato NestJS
            errorMessage = `Error del servidor (Código ${error.status})`;
        }
    }
    // Retornamos el error limpio para que el componente lo lea
    return throwError(() => new Error(errorMessage));
  }    
}