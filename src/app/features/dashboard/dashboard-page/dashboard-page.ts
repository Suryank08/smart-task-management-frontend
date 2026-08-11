import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { TagService } from '../../../core/services/tag.service';
import { TaskService } from '../../../core/services/task.service';
import { TASK_PRIORITIES, TaskDto, TaskPriority, TaskStatus } from '../../../core/models/task.model';
import { getContrastTextColor } from '../../../shared/color-contrast.util';
import { PRIORITY_META, STATUS_META, isOverdue } from '../../../shared/task-display.util';

interface HeatmapDay {
  key: string;
  date: Date;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  tooltip: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatListModule,
    MatChipsModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly notify = inject(NotifyService);
  protected readonly auth = inject(AuthService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly tagService = inject(TagService);
  protected readonly getContrastTextColor = getContrastTextColor;

  protected readonly loading = signal(true);
  protected readonly statusMeta = STATUS_META;
  protected readonly priorityMeta = PRIORITY_META;
  protected readonly isOverdue = isOverdue;

  private readonly tasks = this.taskService.allTasks;

  protected readonly stats = computed(() => {
    const tasks = this.tasks();
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      overdue: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
    };
  });

  protected readonly upcomingTasks = computed(() =>
    this.tasks()
      .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 6),
  );

  protected readonly categoryTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const t of this.tasks()) {
      if (t.status === 'CANCELLED' || !t.categoryId) continue;
      counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
    }
    return counts;
  });

  protected readonly topCategories = computed(() =>
    [...this.categoryService.categories()]
      .sort((a, b) => (this.categoryTaskCounts().get(b.id) ?? 0) - (this.categoryTaskCounts().get(a.id) ?? 0))
      .slice(0, 6),
  );

  protected readonly tagTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const t of this.tasks()) {
      if (t.status === 'CANCELLED') continue;
      for (const tagId of t.tagIds) {
        counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
      }
    }
    return counts;
  });

  protected readonly topTags = computed(() =>
    [...this.tagService.tags()]
      .sort((a, b) => (this.tagTaskCounts().get(b.id) ?? 0) - (this.tagTaskCounts().get(a.id) ?? 0))
      .slice(0, 10),
  );

  protected readonly selectedDate = signal<Date | null>(null);

  private readonly dueDatePriority = computed(() => {
    const map = new Map<string, TaskPriority>();
    for (const t of this.tasks()) {
      if (!t.dueDate || t.status === 'CANCELLED') continue;
      const key = this.dateKey(new Date(t.dueDate));
      const existing = map.get(key);
      if (!existing || TASK_PRIORITIES.indexOf(t.priority) > TASK_PRIORITIES.indexOf(existing)) {
        map.set(key, t.priority);
      }
    }
    return map;
  });

  protected readonly monthTaskCount = computed(() => {
    const now = new Date();
    return this.tasks().filter((t) => {
      if (!t.dueDate || t.status === 'CANCELLED') return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  });

  protected readonly dueTodayCount = computed(() => {
    const key = this.dateKey(new Date());
    return this.tasks().filter(
      (t) => t.dueDate && t.status !== 'CANCELLED' && this.dateKey(new Date(t.dueDate)) === key,
    ).length;
  });

  protected readonly tasksOnSelectedDate = computed(() => {
    const date = this.selectedDate();
    if (!date) return [];
    const key = this.dateKey(date);
    return this.tasks()
      .filter((t) => t.dueDate && t.status !== 'CANCELLED' && this.dateKey(new Date(t.dueDate)) === key)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  });

  protected readonly dateClass: MatCalendarCellClassFunction<Date> = (date) => {
    const priority = this.dueDatePriority().get(this.dateKey(date));
    return priority ? `dashboard-calendar__has-task ${PRIORITY_META[priority].className}` : '';
  };

  protected readonly heatmapLegendLevels = [0, 1, 2, 3, 4] as const;

  protected readonly heatmapWeeks = computed<HeatmapDay[][]>(() => {
    const counts = new Map<string, number>();
    for (const t of this.tasks()) {
      if (!t.completedAt) continue;
      const key = this.dateKey(new Date(t.completedAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - 7 * 52);
    start.setDate(start.getDate() - start.getDay());

    const weeks: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];
    const cursor = new Date(start);

    while (cursor <= today) {
      const key = this.dateKey(cursor);
      const count = counts.get(key) ?? 0;
      currentWeek.push({
        key,
        date: new Date(cursor),
        count,
        level: this.heatLevel(count),
        tooltip: `${count} task${count === 1 ? '' : 's'} completed on ${cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
      });
      if (cursor.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  });

  protected readonly heatmapMonthLabels = computed(() => {
    let lastMonth = -1;
    return this.heatmapWeeks().map((week) => {
      const month = week[0].date.getMonth();
      if (month === lastMonth) return '';
      lastMonth = month;
      return week[0].date.toLocaleDateString(undefined, { month: 'short' });
    });
  });

  protected readonly heatmapCompletedTotal = computed(() =>
    this.heatmapWeeks().reduce(
      (sum, week) => sum + week.reduce((weekSum, day) => weekSum + day.count, 0),
      0,
    ),
  );

  private heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  selectDate(date: Date | null): void {
    const current = this.selectedDate();
    const same = current && date && this.dateKey(current) === this.dateKey(date);
    this.selectedDate.set(same ? null : date);
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

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([
        this.taskService.loadAllForSummary(),
        this.categoryService.load(),
        this.tagService.load(),
      ]);
    } finally {
      this.loading.set(false);
    }
  }
}
