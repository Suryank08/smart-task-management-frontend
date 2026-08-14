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
  pinned: boolean;
  tagIds: string[];
  reminderAt: string | null;
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
  reminderAt?: string | null;
  tagIds?: string[];
  pinned?: boolean;
  subtasks?: string[];
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
  pinned: boolean;
  reminderAt?: string | null;
  tagIds?: string[];
}

export interface TaskFilter {
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  pinned?: boolean | null;
  search?: string;
}
