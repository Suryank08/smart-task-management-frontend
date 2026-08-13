import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { CategoryDto } from '../../../core/models/category.model';
import { TaskDto, TaskStatus } from '../../../core/models/task.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { TaskService } from '../../../core/services/task.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { PRIORITY_META, STATUS_META } from '../../../shared/task-display.util';
import { CategoryDialog } from '../category-dialog/category-dialog';

@Component({
  selector: 'app-categories-page',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatListModule,
    DatePipe,
  ],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.css',
})
export class CategoriesPage {
  protected readonly categoryService = inject(CategoryService);
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  protected readonly priorityMeta = PRIORITY_META;
  protected readonly statusMeta = STATUS_META;
  protected readonly selectedCategory = signal<CategoryDto | null>(null);

  protected readonly categoryTasks = computed(() => {
    const category = this.selectedCategory();
    if (!category) return [];
    return this.taskService.allTasks()
      .filter((t) => t.categoryId === category.id && t.status !== 'CANCELLED')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  });

  protected readonly groupedTasks = computed(() => {
    const tasks = this.categoryTasks();
    const overdue: TaskDto[] = [];
    const today: TaskDto[] = [];
    const upcoming: TaskDto[] = [];
    const noDueDate: TaskDto[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    for (const t of tasks) {
      if (!t.dueDate) {
        noDueDate.push(t);
      } else {
        const d = new Date(t.dueDate);
        if (t.status !== 'COMPLETED' && d < now) {
          overdue.push(t);
        } else if (d >= now && d <= endOfToday) {
          today.push(t);
        } else {
          upcoming.push(t);
        }
      }
    }

    return [
      { label: 'Overdue', tasks: overdue, className: 'overdue' },
      { label: 'Today', tasks: today, className: 'today' },
      { label: 'Upcoming', tasks: upcoming, className: 'upcoming' },
      { label: 'No Due Date', tasks: noDueDate, className: 'no-due' }
    ].filter(group => group.tasks.length > 0);
  });

  protected readonly categoryTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const task of this.taskService.allTasks()) {
      if (task.status === 'CANCELLED' || !task.categoryId) continue;
      counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
    }
    return counts;
  });

  constructor() {
    void this.categoryService.load();
    void this.taskService.loadAllForSummary();
  }

  openCreateDialog(): void {
    this.dialog.open(CategoryDialog, { width: '420px', maxWidth: '95vw', data: { category: null } });
  }

  openEditDialog(category: CategoryDto): void {
    this.dialog.open(CategoryDialog, { width: '420px', maxWidth: '95vw', data: { category } });
  }

  async deleteCategory(category: CategoryDto): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Delete category',
            message: `Delete "${category.name}"? Tasks using it will keep no category.`,
            confirmLabel: 'Delete',
            destructive: true,
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    await this.categoryService.delete(category.id);
    this.notify.success('Category deleted');
  }

  selectCategory(category: CategoryDto | null): void {
    const current = this.selectedCategory();
    const same = current && category && current.id === category.id;
    this.selectedCategory.set(same ? null : category);
  }

  async toggleComplete(task: TaskDto, event: Event): Promise<void> {
    event.stopPropagation();
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await this.taskService.update(task.id, {
      categoryId: task.categoryId,
      title: task.title,
      description: task.description,
      status: nextStatus,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes,
      pinned: task.pinned,
      tagIds: task.tagIds,
    });
    this.notify.success(nextStatus === 'COMPLETED' ? 'Task marked complete' : 'Task reopened');
  }
}
