import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, firstValueFrom, startWith } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { TagService } from '../../../core/services/tag.service';
import { TaskService } from '../../../core/services/task.service';
import { TASK_PRIORITIES, TASK_STATUSES, TaskDto, TaskFilter, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { PRIORITY_META, STATUS_META, isOverdue } from '../../../shared/task-display.util';
import { TaskFormDialog } from '../task-form-dialog/task-form-dialog';

@Component({
  selector: 'app-task-list-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatCheckboxModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './task-list-page.html',
  styleUrl: './task-list-page.css',
})
export class TaskListPage {
  private readonly taskService = inject(TaskService);
  private readonly categoryService = inject(CategoryService);
  private readonly tagService = inject(TagService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  protected readonly page = this.taskService.page;
  protected readonly loading = this.taskService.loading;
  protected readonly categories = this.categoryService.categories;
  protected readonly tags = this.tagService.tags;

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statusMeta = STATUS_META;
  protected readonly priorityMeta = PRIORITY_META;
  protected readonly isOverdue = isOverdue;

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusFilter = signal<TaskStatus | 'ALL'>('ALL');
  protected readonly priorityFilter = signal<TaskPriority | 'ALL'>('ALL');
  protected readonly showArchived = signal(false);

  protected readonly categoryMap = computed(
    () => new Map(this.categories().map((c) => [c.id, c])),
  );
  protected readonly tagMap = computed(() => new Map(this.tags().map((t) => [t.id, t])));

  private readonly debouncedSearch = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(350), startWith('')),
    { initialValue: '' },
  );

  constructor() {
    void this.categoryService.load();
    void this.tagService.load();

    effect(() => {
      const filter: TaskFilter = {
        status: this.statusFilter() === 'ALL' ? null : (this.statusFilter() as TaskStatus),
        priority: this.priorityFilter() === 'ALL' ? null : (this.priorityFilter() as TaskPriority),
        archived: this.showArchived(),
        search: this.debouncedSearch().trim() || undefined,
      };
      this.taskService.setFilter(filter);
      void this.taskService.load();
    });
  }

  onPageChange(event: PageEvent): void {
    this.taskService.setPage(event.pageIndex, event.pageSize);
    void this.taskService.load();
  }

  openCreateDialog(): void {
    this.dialog.open(TaskFormDialog, { width: '640px', maxWidth: '95vw', data: { task: null } });
  }

  openEditDialog(task: TaskDto): void {
    this.dialog.open(TaskFormDialog, { width: '640px', maxWidth: '95vw', data: { task } });
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
      archived: task.archived,
      tagIds: task.tagIds,
    });
    this.notify.success(nextStatus === 'COMPLETED' ? 'Task marked complete' : 'Task reopened');
  }

  async deleteTask(task: TaskDto): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Delete task',
            message: `Delete "${task.title}"? This can't be undone.`,
            confirmLabel: 'Delete',
            destructive: true,
          },
        })
        .afterClosed(),
    );

    if (!confirmed) return;
    await this.taskService.delete(task.id);
    this.notify.success('Task deleted');
  }
}
