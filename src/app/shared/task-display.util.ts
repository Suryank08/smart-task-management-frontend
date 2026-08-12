import { TaskPriority, TaskStatus } from '../core/models/task.model';

export const STATUS_META: Record<TaskStatus, { label: string; icon: string; className: string }> = {
  PENDING: { label: 'Pending', icon: 'schedule', className: 'status-pending' },
  IN_PROGRESS: { label: 'In Progress', icon: 'autorenew', className: 'status-in-progress' },
  COMPLETED: { label: 'Completed', icon: 'check_circle', className: 'status-completed' },
  CANCELLED: { label: 'Cancelled', icon: 'cancel', className: 'status-cancelled' },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; icon: string; className: string }> = {
  LOW: { label: 'Low', icon: 'keyboard_double_arrow_down', className: 'priority-low' },
  MEDIUM: { label: 'Medium', icon: 'trending_flat', className: 'priority-medium' },
  HIGH: { label: 'High', icon: 'keyboard_double_arrow_up', className: 'priority-high' },
  URGENT: { label: 'Urgent', icon: 'error', className: 'priority-urgent' },
};

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  return new Date(dueDate).getTime() < Date.now();
}

export type DueBucket = 'today' | 'upcoming' | 'overdue';

/** Buckets a due date by calendar day relative to now, regardless of task status. */
export function dueBucket(dueDate: string | null): DueBucket | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  if (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  ) {
    return 'today';
  }
  return due.getTime() < now.getTime() ? 'overdue' : 'upcoming';
}
