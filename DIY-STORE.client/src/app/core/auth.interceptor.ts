import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Adauga token-ul la apelurile catre API si trateaza sesiunea respinsa de server. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApiCall = req.url.startsWith('/api/');

  const outgoing =
    token && isApiCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      // 401 pe un apel facut cu token (altul decat login/register) = sesiune invalida sau expirata
      const isAuthEndpoint = req.url.startsWith('/api/auth/login') || req.url.startsWith('/api/auth/register');
      if (error instanceof HttpErrorResponse && error.status === 401 && token && !isAuthEndpoint) {
        auth.expire();
      }
      return throwError(() => error);
    })
  );
};
