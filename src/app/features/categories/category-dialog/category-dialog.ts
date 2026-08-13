import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryDto } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { NotifyService } from '../../../core/services/notify.service';
import { COLOR_PRESETS } from '../../../shared/color-presets.util';

export interface CategoryDialogData {
  category: CategoryDto | null;
}

const ICON_OPTIONS = ['📁', '💼', '🏠', '🎯', '📚', '💪', '🛒', '💰', '🎨', '🧑‍💻', '✈️', '❤️'];

@Component({
  selector: 'app-category-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-dialog.html',
  styleUrl: './category-dialog.css',
})
export class CategoryDialog {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly notify = inject(NotifyService);
  protected readonly dialogRef = inject(MatDialogRef<CategoryDialog>);
  protected readonly data = inject<CategoryDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = this.data.category !== null;
  protected readonly saving = signal(false);
  protected readonly iconOptions = ICON_OPTIONS;
  protected readonly colorPresets = COLOR_PRESETS;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.category?.name ?? '', [Validators.required, Validators.maxLength(50)]],
    icon: [this.data.category?.icon ?? ICON_OPTIONS[0]],
    color: [this.data.category?.color ?? '#6750a4', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      if (this.isEditMode && this.data.category) {
        await this.categoryService.update(this.data.category.id, value);
        this.notify.success('Category updated');
      } else {
        await this.categoryService.create(value);
        this.notify.success('Category created');
      }
      this.dialogRef.close(true);
    } finally {
      this.saving.set(false);
    }
  }
}
