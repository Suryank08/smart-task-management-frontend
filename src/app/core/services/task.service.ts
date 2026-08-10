import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';
import { Page } from '../models/page.model';
import { TaskCreateRequest, TaskDto, TaskFilter, TaskUpdateRequest } from '../models/task.model';
import { AuthService } from './auth.service';

const EMPTY_PAGE: Page<TaskDto> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
  first: true,
  last: true,
  empty: true,
};

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly page = signal<Page<TaskDto>>(EMPTY_PAGE);
  readonly loading = signal(false);
  readonly filter = signal<TaskFilter>({});
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  /** Full unfiltered list for the dashboard's stat computations. */
  readonly allTasks = signal<TaskDto[]>([]);

  private get userId(): string {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No authenticated user');
    return user.id;
  }

  private get baseUrl(): string {
    return `${API_BASE}/users/${this.userId}/tasks`;
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      let params = new HttpParams()
        .set('page', this.pageIndex())
        .set('size', this.pageSize())
        .set('sort', 'dueDate,asc');

      const filter = this.filter();
      if (filter.status) params = params.set('status', filter.status);
      if (filter.priority) params = params.set('priority', filter.priority);
      if (filter.archived !== null && filter.archived !== undefined) {
        params = params.set('archived', filter.archived);
      }
      if (filter.search) params = params.set('search', filter.search);

      const page = await firstValueFrom(this.http.get<Page<TaskDto>>(this.baseUrl, { params }));
      this.page.set(page);
    } finally {
      this.loading.set(false);
    }
  }

  /** Loads a large unfiltered page for dashboard summaries. */
  async loadAllForSummary(): Promise<void> {
    const params = new HttpParams().set('page', 0).set('size', 200).set('archived', false);
    const page = await firstValueFrom(this.http.get<Page<TaskDto>>(this.baseUrl, { params }));
    this.allTasks.set(page.content);
  }

  setFilter(filter: TaskFilter): void {
    this.filter.set(filter);
    this.pageIndex.set(0);
  }

  setPage(index: number, size: number): void {
    this.pageIndex.set(index);
    this.pageSize.set(size);
  }

  findById(id: string): Promise<TaskDto> {
    return firstValueFrom(this.http.get<TaskDto>(`${this.baseUrl}/${id}`));
  }

  async create(request: TaskCreateRequest): Promise<TaskDto> {
    const created = await firstValueFrom(this.http.post<TaskDto>(this.baseUrl, request));
    await this.load();
    return created;
  }

  async update(id: string, request: TaskUpdateRequest): Promise<TaskDto> {
    const updated = await firstValueFrom(this.http.put<TaskDto>(`${this.baseUrl}/${id}`, request));
    this.page.update((p) => ({
      ...p,
      content: p.content.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
    await this.load();
  }
}
