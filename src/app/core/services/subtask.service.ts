import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';
import { SubtaskDto, SubtaskRequest } from '../models/subtask.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SubtaskService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private get userId(): string {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No authenticated user');
    return user.id;
  }

  private baseUrl(taskId: string): string {
    return `${API_BASE}/users/${this.userId}/tasks/${taskId}/subtasks`;
  }

  list(taskId: string): Promise<SubtaskDto[]> {
    return firstValueFrom(this.http.get<SubtaskDto[]>(this.baseUrl(taskId)));
  }

  create(taskId: string, request: SubtaskRequest): Promise<SubtaskDto> {
    return firstValueFrom(this.http.post<SubtaskDto>(this.baseUrl(taskId), request));
  }

  update(taskId: string, id: string, request: SubtaskRequest): Promise<SubtaskDto> {
    return firstValueFrom(this.http.put<SubtaskDto>(`${this.baseUrl(taskId)}/${id}`, request));
  }

  delete(taskId: string, id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl(taskId)}/${id}`));
  }
}
