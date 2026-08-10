import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';
import { UserCreateRequest, UserDto, UserUpdateRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  create(request: UserCreateRequest): Promise<UserDto> {
    return firstValueFrom(this.http.post<UserDto>(`${API_BASE}/users`, request));
  }

  findById(id: string): Promise<UserDto> {
    return firstValueFrom(this.http.get<UserDto>(`${API_BASE}/users/${id}`));
  }

  update(id: string, request: UserUpdateRequest): Promise<UserDto> {
    return firstValueFrom(this.http.put<UserDto>(`${API_BASE}/users/${id}`, request));
  }
}
