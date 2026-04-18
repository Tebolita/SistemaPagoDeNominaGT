import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

export function authGuard(): boolean | UrlTree {
  const token = localStorage.getItem('access_token');
  if (token) {
    return true;
  }

  const router = inject(Router);
  return router.parseUrl('/login');
}
