import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';
import { AuthResponse, LoginRequest, UserCreateRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  register(request: UserCreateRequest): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${API_BASE}/auth/register`, request));
  }

  login(request: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(this.http.post<AuthResponse>(`${API_BASE}/auth/login`, request));
  }
}
