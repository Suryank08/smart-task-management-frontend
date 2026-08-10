import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotifyService } from '../../../core/services/notify.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-auth-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotifyService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly submitting = signal(false);
  protected readonly continuingId = signal<string | null>(null);

  protected readonly knownAccounts = this.auth.knownAccounts;

  protected readonly signUpForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    timezone: [Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'],
  });

  async submitSignUp(): Promise<void> {
    if (this.signUpForm.invalid || this.submitting()) {
      this.signUpForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    try {
      const value = this.signUpForm.getRawValue();
      const user = await this.auth.signUp(value);
      this.notify.success(`Welcome, ${user.name}!`);
      await this.router.navigateByUrl('/dashboard');
    } finally {
      this.submitting.set(false);
    }
  }

  async continueAs(userId: string): Promise<void> {
    if (this.continuingId()) return;
    this.continuingId.set(userId);
    try {
      const user = await this.auth.continueAs(userId);
      this.notify.success(`Welcome back, ${user.name}!`);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.auth.forgetAccount(userId);
    } finally {
      this.continuingId.set(null);
    }
  }

  forgetAccount(event: Event, userId: string): void {
    event.stopPropagation();
    this.auth.forgetAccount(userId);
  }
}
