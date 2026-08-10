import { Component, inject } from '@angular/core';
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
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { TagDialog } from '../tag-dialog/tag-dialog';

@Component({
  selector: 'app-tags-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  templateUrl: './tags-page.html',
  styleUrl: './tags-page.css',
})
export class TagsPage {
  protected readonly tagService = inject(TagService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  constructor() {
    void this.tagService.load();
  }

  openCreateDialog(): void {
    this.dialog.open(TagDialog, { width: '380px', data: { tag: null } });
  }

  openEditDialog(tag: TagDto): void {
    this.dialog.open(TagDialog, { width: '380px', data: { tag } });
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
