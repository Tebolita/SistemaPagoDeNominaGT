import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { catchError, Observable, throwError } from "rxjs";
import { LoginRequest,LoginResponse } from "../models/login.model";

@Injectable({
    providedIn: 'root'
})
export class LoginService{
    private apiUrl = 'http://localhost:4000/api/login';

    constructor(private http: HttpClient) {}

    signIn(credenciales: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
            catchError(this.handleError)
        )
    }

  private handleError(error: any): Observable<never> {
    console.error('Error en la API:', error);
    return throwError(() => new Error('Error del servidor'));
  }    
}