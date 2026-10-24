import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { haySesion, limpiarSesion } from './sesion';

export function authGuard(): boolean | UrlTree {
  if (haySesion()) {
    return true;
  }
  limpiarSesion();
  return inject(Router).parseUrl('/login');
}
