import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { CategoryDto } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { CategoryDialog } from '../category-dialog/category-dialog';

@Component({
  selector: 'app-categories-page',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.css',
})
export class CategoriesPage {
  protected readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  constructor() {
    void this.categoryService.load();
  }

  openCreateDialog(): void {
    this.dialog.open(CategoryDialog, { width: '420px', data: { category: null } });
  }

  openEditDialog(category: CategoryDto): void {
    this.dialog.open(CategoryDialog, { width: '420px', data: { category } });
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
}
