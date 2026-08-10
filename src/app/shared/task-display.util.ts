import { TaskPriority, TaskStatus } from '../core/models/task.model';

export const STATUS_META: Record<TaskStatus, { label: string; icon: string; className: string }> = {
  PENDING: { label: 'Pending', icon: 'schedule', className: 'status-pending' },
  IN_PROGRESS: { label: 'In Progress', icon: 'autorenew', className: 'status-in-progress' },
  COMPLETED: { label: 'Completed', icon: 'check_circle', className: 'status-completed' },
  CANCELLED: { label: 'Cancelled', icon: 'cancel', className: 'status-cancelled' },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; icon: string; className: string }> = {
  LOW: { label: 'Low', icon: 'south', className: 'priority-low' },
  MEDIUM: { label: 'Medium', icon: 'drag_handle', className: 'priority-medium' },
  HIGH: { label: 'High', icon: 'north', className: 'priority-high' },
  URGENT: { label: 'Urgent', icon: 'priority_high', className: 'priority-urgent' },
};

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  return new Date(dueDate).getTime() < Date.now();
}
