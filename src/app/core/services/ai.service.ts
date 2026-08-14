import { HttpClient, HttpResponse } from '@angular/common/http';
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

export interface AiPlannedTask {
  taskId: string;
  suggestedOrder: number;
  reason: string;
}

export interface AiPlanDetails {
  explanation: string;
  tasks: AiPlannedTask[];
}

export interface AiPlanDto {
  id: string;
  userId: string;
  planDetails: AiPlanDetails;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  async parseTask(text: string): Promise<AiParserResponse> {
    return firstValueFrom(
      this.http.post<AiParserResponse>(`${API_BASE}/ai/parse-task`, { text })
    );
  }

  async generatePlan(userId: string): Promise<AiPlanDto> {
    return firstValueFrom(
      this.http.post<AiPlanDto>(`${API_BASE}/users/${userId}/ai-plans/generate`, {})
    );
  }

  async getLatestPlan(userId: string): Promise<AiPlanDto | null> {
    return firstValueFrom(
      this.http.get<AiPlanDto | null>(`${API_BASE}/users/${userId}/ai-plans/latest`, { observe: 'response' })
    ).then(response => {
      if (response.status === 204) {
        return null;
      }
      return response.body;
    });
  }
}
