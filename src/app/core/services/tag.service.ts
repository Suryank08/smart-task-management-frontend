import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';
import { TagDto, TagRequest } from '../models/tag.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly tags = signal<TagDto[]>([]);
  readonly loading = signal(false);

  private get userId(): string {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No authenticated user');
    return user.id;
  }

  private get baseUrl(): string {
    return `${API_BASE}/users/${this.userId}/tags`;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const tags = await firstValueFrom(this.http.get<TagDto[]>(this.baseUrl));
      this.tags.set(tags);
    } finally {
      this.loading.set(false);
    }
  }

  async create(request: TagRequest): Promise<TagDto> {
    const created = await firstValueFrom(this.http.post<TagDto>(this.baseUrl, request));
    this.tags.update((list) => [...list, created]);
    return created;
  }

  async update(id: string, request: TagRequest): Promise<TagDto> {
    const updated = await firstValueFrom(this.http.put<TagDto>(`${this.baseUrl}/${id}`, request));
    this.tags.update((list) => list.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this.tags.update((list) => list.filter((t) => t.id !== id));
  }
}
