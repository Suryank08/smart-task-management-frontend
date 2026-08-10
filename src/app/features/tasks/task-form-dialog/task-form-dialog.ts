import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { SubtaskService } from '../../../core/services/subtask.service';
import { TagService } from '../../../core/services/tag.service';
import { TaskService } from '../../../core/services/task.service';
import { SubtaskDto } from '../../../core/models/subtask.model';
import { TASK_PRIORITIES, TASK_STATUSES, TaskDto } from '../../../core/models/task.model';
import { PRIORITY_META, STATUS_META } from '../../../shared/task-display.util';

export interface TaskFormDialogData {
  task: TaskDto | null;
}

@Component({
  selector: 'app-task-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatListModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.css',
})
export class TaskFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly subtaskService = inject(SubtaskService);
  private readonly notify = inject(NotifyService);
  protected readonly dialogRef = inject(MatDialogRef<TaskFormDialog>);
  protected readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);

  protected readonly categoryService = inject(CategoryService);
  protected readonly tagService = inject(TagService);

  protected readonly isEditMode = this.data.task !== null;
  protected readonly saving = signal(false);
  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly statusMeta = STATUS_META;
  protected readonly priorityMeta = PRIORITY_META;

  protected readonly subtasks = signal<SubtaskDto[]>([]);
  protected readonly subtasksLoading = signal(false);
  protected readonly newSubtaskTitle = new FormControl('', { nonNullable: true });
  protected readonly savingSubtaskId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: [this.data.task?.title ?? '', [Validators.required, Validators.maxLength(255)]],
    description: [this.data.task?.description ?? ''],
    categoryId: [this.data.task?.categoryId ?? null as string | null],
    status: [this.data.task?.status ?? 'PENDING'],
    priority: [this.data.task?.priority ?? 'MEDIUM'],
    startDate: [this.data.task?.startDate ? new Date(this.data.task.startDate) : (null as Date | null)],
    dueDate: [this.data.task?.dueDate ? new Date(this.data.task.dueDate) : (null as Date | null)],
    estimatedMinutes: [this.data.task?.estimatedMinutes ?? (null as number | null)],
    archived: [this.data.task?.archived ?? false],
    tagIds: [this.data.task?.tagIds ?? ([] as string[])],
  });

  constructor() {
    void this.categoryService.load();
    void this.tagService.load();
    if (this.data.task) {
      void this.loadSubtasks(this.data.task.id);
    }
  }

  private async loadSubtasks(taskId: string): Promise<void> {
    this.subtasksLoading.set(true);
    try {
      this.subtasks.set(await this.subtaskService.list(taskId));
    } finally {
      this.subtasksLoading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      const startDate = value.startDate ? value.startDate.toISOString() : null;
      const dueDate = value.dueDate ? value.dueDate.toISOString() : null;

      if (this.isEditMode && this.data.task) {
        await this.taskService.update(this.data.task.id, {
          categoryId: value.categoryId,
          title: value.title,
          description: value.description || null,
          status: value.status,
          priority: value.priority,
          startDate,
          dueDate,
          estimatedMinutes: value.estimatedMinutes,
          actualMinutes: this.data.task.actualMinutes,
          archived: value.archived,
          tagIds: value.tagIds,
        });
        this.notify.success('Task updated');
      } else {
        await this.taskService.create({
          categoryId: value.categoryId,
          title: value.title,
          description: value.description || null,
          priority: value.priority,
          startDate,
          dueDate,
          estimatedMinutes: value.estimatedMinutes,
          tagIds: value.tagIds,
        });
        this.notify.success('Task created');
      }
      this.dialogRef.close(true);
    } finally {
      this.saving.set(false);
    }
  }

  async addSubtask(): Promise<void> {
    const title = this.newSubtaskTitle.value.trim();
    if (!title || !this.data.task) return;
    const created = await this.subtaskService.create(this.data.task.id, {
      title,
      completed: false,
      position: this.subtasks().length,
    });
    this.subtasks.update((list) => [...list, created]);
    this.newSubtaskTitle.setValue('');
  }

  async toggleSubtask(subtask: SubtaskDto): Promise<void> {
    if (!this.data.task) return;
    this.savingSubtaskId.set(subtask.id);
    try {
      const updated = await this.subtaskService.update(this.data.task.id, subtask.id, {
        title: subtask.title,
        completed: !subtask.completed,
        position: subtask.position,
      });
      this.subtasks.update((list) => list.map((s) => (s.id === subtask.id ? updated : s)));
    } finally {
      this.savingSubtaskId.set(null);
    }
  }

  async removeSubtask(subtask: SubtaskDto): Promise<void> {
    if (!this.data.task) return;
    await this.subtaskService.delete(this.data.task.id, subtask.id);
    this.subtasks.update((list) => list.filter((s) => s.id !== subtask.id));
  }

  protected readonly completedSubtaskCount = () =>
    this.subtasks().filter((s) => s.completed).length;
}
