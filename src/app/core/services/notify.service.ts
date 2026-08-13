import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 3000, panelClass: 'notify-success' });
  }

  warning(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000, panelClass: 'notify-warning' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 5000, panelClass: 'notify-error' });
  }
}
