import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';

export function roleGuard(route: ActivatedRouteSnapshot): boolean | UrlTree {
  const allowedRoles: string[] = route.data['roles'] ?? [];
  if (allowedRoles.length === 0) return true;

  const raw = (localStorage.getItem('user_role') ?? '').trim().toUpperCase();
  const normalized = raw.replace(/\s+/g, '_');

  const hasAccess = allowedRoles.some(r => {
    const rn = r.toUpperCase().replace(/\s+/g, '_');
    return rn === raw || rn === normalized;
  });

  if (hasAccess) return true;

  return inject(Router).parseUrl('/home/inicio');
}
