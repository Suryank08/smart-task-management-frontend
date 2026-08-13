import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { TagDto } from '../../../core/models/tag.model';
import { NotifyService } from '../../../core/services/notify.service';
import { TagService } from '../../../core/services/tag.service';
import { TaskService } from '../../../core/services/task.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { getContrastTextColor } from '../../../shared/color-contrast.util';
import { TagDialog } from '../tag-dialog/tag-dialog';

@Component({
  selector: 'app-tags-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './tags-page.html',
  styleUrl: './tags-page.css',
})
export class TagsPage {
  protected readonly tagService = inject(TagService);
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  protected readonly getContrastTextColor = getContrastTextColor;

  protected readonly tagTaskCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const task of this.taskService.allTasks()) {
      if (task.status === 'CANCELLED') continue;
      for (const tagId of task.tagIds) {
        counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
      }
    }
    return counts;
  });

  constructor() {
    void this.tagService.load();
    void this.taskService.loadAllForSummary();
  }

  openCreateDialog(): void {
    this.dialog.open(TagDialog, { width: '380px', maxWidth: '95vw', data: { tag: null } });
  }

  openEditDialog(tag: TagDto): void {
    this.dialog.open(TagDialog, { width: '380px', maxWidth: '95vw', data: { tag } });
  }

  async deleteTag(tag: TagDto): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: {
            title: 'Delete tag',
            message: `Delete "${tag.name}"? It will be removed from all tasks.`,
            confirmLabel: 'Delete',
            destructive: true,
          },
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    await this.tagService.delete(tag.id);
    this.notify.success('Tag deleted');
  }
}
