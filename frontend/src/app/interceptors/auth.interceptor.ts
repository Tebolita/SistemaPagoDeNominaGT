import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { limpiarSesion } from '../sesion';

// La sesión viaja en una cookie httpOnly: se envía con withCredentials. X-Requested-With es la
// defensa anti-CSRF que el backend exige en las peticiones que modifican datos.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authReq = req.clone({
    withCredentials: true,
    setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
  });

  return next(authReq).pipe(
    catchError((err: unknown) => {
      // Sesión vencida o inválida: se limpia y se vuelve al login (salvo en el propio login)
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/login/login')) {
        limpiarSesion();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
