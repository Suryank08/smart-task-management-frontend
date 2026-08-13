import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TagDto } from '../../../core/models/tag.model';
import { NotifyService } from '../../../core/services/notify.service';
import { TagService } from '../../../core/services/tag.service';
import { COLOR_PRESETS } from '../../../shared/color-presets.util';

export interface TagDialogData {
  tag: TagDto | null;
}

@Component({
  selector: 'app-tag-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tag-dialog.html',
  styleUrl: './tag-dialog.css',
})
export class TagDialog {
  private readonly fb = inject(FormBuilder);
  private readonly tagService = inject(TagService);
  private readonly notify = inject(NotifyService);
  protected readonly dialogRef = inject(MatDialogRef<TagDialog>);
  protected readonly data = inject<TagDialogData>(MAT_DIALOG_DATA);

  protected readonly isEditMode = this.data.tag !== null;
  protected readonly saving = signal(false);
  protected readonly colorPresets = COLOR_PRESETS;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.tag?.name ?? '', [Validators.required, Validators.maxLength(30)]],
    color: [this.data.tag?.color ?? '#00696d', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      if (this.isEditMode && this.data.tag) {
        await this.tagService.update(this.data.tag.id, value);
        this.notify.success('Tag updated');
      } else {
        await this.tagService.create(value);
        this.notify.success('Tag created');
      }
      this.dialogRef.close(true);
    } finally {
      this.saving.set(false);
    }
  }
}
