import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../services/notify.service';

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotifyService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        (error.error?.message as string | undefined) ??
        (error.status === 0 ? 'Cannot reach the server. Is the backend running?' : error.message);

      if (error.status === 401 && !AUTH_ENDPOINTS.some((path) => req.url.includes(path))) {
        auth.signOut();
        notify.error('Your session has expired. Please sign in again.');
        void router.navigateByUrl('/auth');
      } else {
        notify.error(message);
      }
      return throwError(() => error);
    }),
  );
};
