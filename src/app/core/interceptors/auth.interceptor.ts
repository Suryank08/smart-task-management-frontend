import { HttpInterceptorFn } from '@angular/common/http';
import { getToken } from '../services/token-storage';

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getToken();
  if (!token || AUTH_ENDPOINTS.some((path) => req.url.includes(path))) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
