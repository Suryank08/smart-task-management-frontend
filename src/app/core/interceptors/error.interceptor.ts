import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotifyService } from '../services/notify.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotifyService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        (error.error?.message as string | undefined) ??
        (error.status === 0 ? 'Cannot reach the server. Is the backend running?' : error.message);
      notify.error(message);
      return throwError(() => error);
    }),
  );
};
