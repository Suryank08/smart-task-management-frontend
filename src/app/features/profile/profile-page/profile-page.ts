import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);

  protected readonly saving = signal(false);

  private readonly currentUser = this.auth.currentUser()!;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.currentUser.name, [Validators.required, Validators.maxLength(100)]],
    avatarUrl: [this.currentUser.avatarUrl ?? ''],
    timezone: [this.currentUser.timezone, [Validators.required]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const value = this.form.getRawValue();
      const updated = await this.userService.update(this.currentUser.id, {
        name: value.name,
        avatarUrl: value.avatarUrl || null,
        timezone: value.timezone,
        preferences: this.currentUser.preferences,
      });
      this.auth.updateCurrentUser(updated);
      this.notify.success('Profile updated');
    } finally {
      this.saving.set(false);
    }
  }

  async signOut(): Promise<void> {
    this.auth.signOut();
    await this.router.navigateByUrl('/auth');
  }
}
