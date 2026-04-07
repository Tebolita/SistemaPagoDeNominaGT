import { Injectable } from "@angular/core";
import { HttpClient, HttpRequest, HttpHandler, HttpInterceptor, HttpEvent } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        const token = localStorage.getItem('access_token');

        if (token) {
            const authReq = req.clone({
                headers: req.headers.set('Authorization',  `Bearer ${token}`)
            })
            return next.handle(authReq);
        }

        return next.handle(req);
    }
}