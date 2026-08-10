import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { PRIORITY_META, STATUS_META, isOverdue } from '../../../shared/task-display.util';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit {
  private readonly taskService = inject(TaskService);
  protected readonly auth = inject(AuthService);

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

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.taskService.loadAllForSummary();
    } finally {
      this.loading.set(false);
    }
  }
}
