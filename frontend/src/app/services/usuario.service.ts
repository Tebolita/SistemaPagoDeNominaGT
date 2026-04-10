import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { UsuarioRequest, UsuarioResponse, UsuarioResponseCUD } from "../models/Usuario.model";

@Injectable({
    providedIn: 'root'
})
export class UsuarioService{
    private apiUrl = 'http://localhost:4000/api/usuario';

    constructor(private http: HttpClient) {}

    CrearUsuario(usuario: UsuarioRequest): Observable<UsuarioResponseCUD>{
        return this.http.post<UsuarioResponseCUD>(`${this.apiUrl}/CrearUsuario`, usuario).pipe(
           catchError(this.handleError) 
        )
    }    

    private handleError(error: any): Observable<never> {
        return throwError(() => new Error('Error interno del servidor'));
    }   
}