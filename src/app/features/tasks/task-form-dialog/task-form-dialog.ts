import { Component, inject, signal, NgZone, ChangeDetectorRef } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { SubtaskService } from '../../../core/services/subtask.service';
import { TagService } from '../../../core/services/tag.service';
import { TaskService } from '../../../core/services/task.service';
import { AiService } from '../../../core/services/ai.service';
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
    MatTooltipModule,
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
  private readonly aiService = inject(AiService);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly isListening = signal(false);
  protected readonly aiInputText = new FormControl('', { nonNullable: true });
  protected readonly aiLoading = signal(false);
  private recognition: any = null;

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
    reminderDate: [this.data.task?.reminderAt ? new Date(this.data.task.reminderAt) : (null as Date | null)],
    reminderTime: [this.data.task?.reminderAt ? toLocalTimeString(new Date(this.data.task.reminderAt)) : ''],
    pinned: [this.data.task?.pinned ?? false],
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
      
      let dueDate: string | null = null;
      if (value.dueDate) {
        const d = new Date(value.dueDate);
        d.setHours(23, 59, 0, 0);
        dueDate = d.toISOString();
      }
      
      let reminderAt: string | null = null;
      if (value.reminderDate) {
        const date = new Date(value.reminderDate);
        let time = value.reminderTime;
        if (!time) {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const isToday = date.toDateString() === now.toDateString();
          const isDueDate = value.dueDate && date.toDateString() === new Date(value.dueDate).toDateString();
          
          if (isDueDate) {
            time = '23:59';
          } else if (isToday) {
            time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
          } else {
            time = '09:00';
          }
        }
        const [hours, minutes] = time.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
        reminderAt = date.toISOString();
      }

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
          reminderAt,
          pinned: value.pinned,
          tagIds: value.tagIds,
        });
        this.notify.success('Task updated');
      } else {
        const subtaskTitles = this.subtasks().map(s => s.title);
        await this.taskService.create({
          categoryId: value.categoryId,
          title: value.title,
          description: value.description || null,
          priority: value.priority,
          startDate,
          dueDate,
          estimatedMinutes: value.estimatedMinutes,
          reminderAt,
          tagIds: value.tagIds,
          pinned: value.pinned,
          subtasks: subtaskTitles
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
    if (!title) return;

    if (this.isEditMode && this.data.task) {
      const created = await this.subtaskService.create(this.data.task.id, {
        title,
        completed: false,
        position: this.subtasks().length,
      });
      this.subtasks.update((list) => [...list, created]);
    } else {
      const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        const newSubtask: SubtaskDto = {
          id: tempId,
          taskId: this.isEditMode && this.data.task ? this.data.task.id : '',
          title,
          completed: false,
          position: this.subtasks().length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.subtasks.update((list) => [...list, newSubtask]);
    }
    this.newSubtaskTitle.setValue('');
    this.cdr.markForCheck();
  }

  async toggleSubtask(subtask: SubtaskDto): Promise<void> {
    if (this.isEditMode && this.data.task) {
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
    } else {
      this.subtasks.update((list) =>
        list.map((s) => (s.id === subtask.id ? { ...s, completed: !s.completed } : s))
      );
    }
    this.cdr.markForCheck();
  }

  async removeSubtask(subtask: SubtaskDto): Promise<void> {
    if (this.isEditMode && this.data.task) {
      await this.subtaskService.delete(this.data.task.id, subtask.id);
    }
    this.subtasks.update((list) => list.filter((s) => s.id !== subtask.id));
    this.cdr.markForCheck();
  }

  protected readonly completedSubtaskCount = () =>
    this.subtasks().filter((s) => s.completed).length;

  initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.notify.error('Web Speech API is not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.zone.run(() => {
        this.isListening.set(true);
      });
    };

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      this.zone.run(() => {
        this.aiInputText.setValue(transcript);
      });
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      this.zone.run(() => {
        this.isListening.set(false);
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => {
        this.isListening.set(false);
      });
    };
  }

  toggleListening(): void {
    if (!this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) return;

    if (this.isListening()) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  async useAiFill(): Promise<void> {
    const text = this.aiInputText.value.trim();
    if (!text) {
      this.notify.warning('Please enter some unstructured text or speak first.');
      return;
    }
    this.aiLoading.set(true);
    try {
      const parsed = await this.aiService.parseTask(text);

      this.form.patchValue({
        title: parsed.title || this.form.value.title || '',
        description: parsed.description || this.form.value.description || '',
        priority: parsed.priority || 'MEDIUM',
        estimatedMinutes: parsed.estimatedMinutes || null,
      });

      if (parsed.dueDate) {
        this.form.patchValue({
          dueDate: new Date(parsed.dueDate)
        });
      }

      // Auto-add subtasks if provided by AI
      if (parsed.subtasks && Array.isArray(parsed.subtasks) && parsed.subtasks.length) {
        const existingCount = this.subtasks().length;
        const newSubs: SubtaskDto[] = parsed.subtasks.map((title: string, idx: number) => ({
          id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
          taskId: this.isEditMode && this.data.task ? this.data.task.id : '',
          title: title.trim(),
          completed: false,
          position: existingCount + idx,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        this.subtasks.update(list => [...list, ...newSubs]);
      }

      this.cdr.markForCheck();
      this.notify.success('Task details auto-populated by AI!');
    } catch (error) {
      console.error('AI Parse failed', error);
      this.notify.error('Failed to parse text. Please try again.');
      this.cdr.markForCheck();
    } finally {
      this.aiLoading.set(false);
      this.cdr.markForCheck();
    }
  }
}

function toLocalTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
