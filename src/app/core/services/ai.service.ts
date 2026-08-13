import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../constants/api.constants';

export interface AiParserResponse {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  estimatedMinutes: number | null;
  subtasks?: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  async parseTask(text: string): Promise<AiParserResponse> {
    return firstValueFrom(
      this.http.post<AiParserResponse>(`${API_BASE}/ai/parse-task`, { text })
    );
  }
}
