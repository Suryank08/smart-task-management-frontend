export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export interface TaskDto {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  archived: boolean;
  aiMetadata: Record<string, unknown>;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskCreateRequest {
  categoryId?: string | null;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  tagIds?: string[];
}

export interface TaskUpdateRequest {
  categoryId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  archived: boolean;
  tagIds?: string[];
}

export interface TaskFilter {
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  archived?: boolean | null;
  search?: string;
}
