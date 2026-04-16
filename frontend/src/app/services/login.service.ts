import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, Observable } from "rxjs";
import { LoginRequest,LoginResponse } from "../models/login.model";
import { ErrorService } from "./error.service";

@Injectable({
    providedIn: 'root'
})
export class LoginService{
    private apiUrl = 'http://localhost:4000/api/login';

    constructor(
        private http: HttpClient, 
        private errorService: ErrorService
    ) {}

    signIn(credenciales: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
            catchError(this.errorService.handleError)
        )
    }

    logout(): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/logout`, '').pipe(
            catchError(this.errorService.handleError)
        )
    }

}