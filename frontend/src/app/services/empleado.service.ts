import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { EmpleadoResponse, EmpleadoResponseCUD, EmpleadoRequest } from "../models/Empleado.model";
import { ErrorService } from "./error.service";

@Injectable({
    providedIn: 'root'
})
export class EmpleadoService{
    private apiUrl = 'http://localhost:4000/api/empleado';

    constructor(
        private http: HttpClient, 
        private errorService: ErrorService
    ) { }

    ObtenerEmplados(): Observable<EmpleadoResponse[]> {
        return this.http.get<EmpleadoResponse[]>(this.apiUrl).pipe(
            catchError(this.errorService.handleError)
        )
    }

    ActualizarEmpleado(id: number,empleado: EmpleadoRequest): Observable<EmpleadoResponseCUD>{
        return this.http.patch<EmpleadoResponseCUD>(`${this.apiUrl}/${id}`, empleado).pipe(
           catchError(this.errorService.handleError) 
        )
    }

    CrearEmpleado(empleado: EmpleadoRequest): Observable<EmpleadoResponseCUD>{
        return this.http.post<EmpleadoResponseCUD>(`${this.apiUrl}/CrearEmpleado`, empleado).pipe(
           catchError(this.errorService.handleError) 
        )
    }
}