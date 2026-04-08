import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { EmpleadoInterface, EmpleadoResponse } from "../models/Empleado.model";

@Injectable({
    providedIn: 'root'
})
export class EmpleadoService{
    private apiUrl = 'http://localhost:4000/api/empleado';

    constructor(private http: HttpClient) {}

    ObtenerEmplados(): Observable<EmpleadoInterface[]> {
        return this.http.get<EmpleadoInterface[]>(this.apiUrl).pipe(
            catchError(this.handleError)
        )
    }

    ActualizarEmpleado(id: number,empleado: EmpleadoInterface): Observable<EmpleadoResponse>{
        return this.http.patch<EmpleadoResponse>(`${this.apiUrl}/${id}`, empleado).pipe(
           catchError(this.handleError) 
        )
    }

    private handleError(error: any): Observable<never> {
        return throwError(() => new Error('Error interno del servidor'));
    }   
}