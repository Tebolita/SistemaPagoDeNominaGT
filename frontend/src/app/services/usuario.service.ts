import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable } from "rxjs";
import { UsuarioRequest, UsuarioResponseCUD, UsuarioInterface } from "../models/Usuario.model";
import { ErrorService } from "./error.service";

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private apiUrl = 'http://localhost:4000/api/usuario';

    constructor(
        private http: HttpClient, 
        private errorService: ErrorService
    ) {}

    // CREATE
    CrearUsuario(usuario: UsuarioRequest): Observable<UsuarioResponseCUD> {
        return this.http.post<UsuarioResponseCUD>(`${this.apiUrl}/CrearUsuario`, usuario).pipe(
           catchError(this.errorService.handleError) 
        );
    } 

    CrearSoloUsuario(usuario: UsuarioInterface): Observable<UsuarioResponseCUD> {
        return this.http.post<UsuarioResponseCUD>(`${this.apiUrl}/CrearUsuario`, usuario).pipe(
           catchError(this.errorService.handleError) 
        );
    }     

    // READ (Todos)
    // Usamos la interfaz 'Usuario' porque el backend nos devuelve el IdUsuario y el RolUsuario
    ObtenerUsuarios(): Observable<UsuarioInterface[]> {
        return this.http.get<UsuarioInterface[]>(`${this.apiUrl}/VerUsuarios`).pipe(
            catchError(this.errorService.handleError)
        );
    }

    // READ (Uno solo)
    ObtenerUsuarioPorId(id: number): Observable<UsuarioInterface> {
        return this.http.get<UsuarioInterface>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.errorService.handleError)
        );
    }

    // UPDATE
    // Usamos Partial<UsuarioRequest> porque al actualizar, todos los campos son opcionales
    ActualizarUsuario(id: number, usuario: Partial<UsuarioRequest>): Observable<UsuarioResponseCUD> {
        return this.http.patch<UsuarioResponseCUD>(`${this.apiUrl}/${id}`, usuario).pipe(
            catchError(this.errorService.handleError)
        );
    }

    // DELETE
    EliminarUsuario(id: number): Observable<UsuarioResponseCUD> {
        return this.http.delete<UsuarioResponseCUD>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.errorService.handleError)
        );
    }
}