import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { AiService, AiPlanDto } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../../core/services/task.service';
import { NotifyService } from '../../../core/services/notify.service';
import { TaskDto, TaskStatus } from '../../../core/models/task.model';

@Component({
  selector: 'app-ai-plan-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatChipsModule,
    RouterLink,
  ],
  templateUrl: './ai-plan-page.html',
  styleUrl: './ai-plan-page.css',
})
export class AiPlanPage implements OnInit {
  private readonly aiService = inject(AiService);
  protected readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotifyService);

  protected readonly plan = signal<AiPlanDto | null>(null);
  protected readonly loading = signal(false);
  protected readonly generating = signal(false);

  private get userId(): string {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not logged in');
    return user.id;
  }

  protected readonly plannedTasks = computed(() => {
    const planObj = this.plan();
    if (!planObj || !planObj.planDetails || !planObj.planDetails.tasks) return [];

    return planObj.planDetails.tasks
      .map((pt) => {
        const task = this.taskService.allTasks().find((t) => t.id === pt.taskId);
        return {
          ...pt,
          task,
        };
      })
      .filter((item) => !!item.task);
  });

  protected readonly hasActiveTasks = computed(() => {
    return this.taskService.allTasks().some(
      (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    );
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.taskService.loadAllForSummary();
      const latestPlan = await this.aiService.getLatestPlan(this.userId);
      this.plan.set(latestPlan);
    } catch (e) {
      this.notify.error('Failed to load daily plan data');
    } finally {
      this.loading.set(false);
    }
  }

  async generatePlan(): Promise<void> {
    if (this.generating()) return;
    this.generating.set(true);
    try {
      await this.taskService.loadAllForSummary();
      const newPlan = await this.aiService.generatePlan(this.userId);
      this.plan.set(newPlan);
      this.notify.success('AI Daily Plan generated successfully!');
    } catch (e) {
      this.notify.error('Failed to generate daily plan');
    } finally {
      this.generating.set(false);
    }
  }

  async toggleTaskStatus(task: TaskDto): Promise<void> {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await this.taskService.update(task.id, {
        title: task.title,
        status: nextStatus,
        priority: task.priority,
        pinned: task.pinned,
        description: task.description,
        startDate: task.startDate,
        dueDate: task.dueDate,
        estimatedMinutes: task.estimatedMinutes,
        tagIds: task.tagIds,
        reminderAt: task.reminderAt,
      });
      this.notify.success(nextStatus === 'COMPLETED' ? 'Task marked complete' : 'Task reopened');
    } catch (e) {
      this.notify.error('Failed to update task status');
    }
  }

  getPriorityColor(priority: string): string {
    return switchPriorityColor(priority);
  }
}

function switchPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'warn';
    case 'HIGH':
      return 'accent';
    case 'MEDIUM':
      return 'primary';
    default:
      return '';
  }
}
