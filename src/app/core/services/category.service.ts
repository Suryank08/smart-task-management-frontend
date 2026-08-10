import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';
import { CategoryDto, CategoryRequest } from '../models/category.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly categories = signal<CategoryDto[]>([]);
  readonly loading = signal(false);

  private get userId(): string {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No authenticated user');
    return user.id;
  }

  private get baseUrl(): string {
    return `${API_BASE}/users/${this.userId}/categories`;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const categories = await firstValueFrom(this.http.get<CategoryDto[]>(this.baseUrl));
      this.categories.set(categories);
    } finally {
      this.loading.set(false);
    }
  }

  async create(request: CategoryRequest): Promise<CategoryDto> {
    const created = await firstValueFrom(this.http.post<CategoryDto>(this.baseUrl, request));
    this.categories.update((list) => [...list, created]);
    return created;
  }

  async update(id: string, request: CategoryRequest): Promise<CategoryDto> {
    const updated = await firstValueFrom(this.http.put<CategoryDto>(`${this.baseUrl}/${id}`, request));
    this.categories.update((list) => list.map((c) => (c.id === id ? updated : c)));
    return updated;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    this.categories.update((list) => list.filter((c) => c.id !== id));
  }
}
