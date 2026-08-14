import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password-page/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list-page/task-list-page').then((m) => m.TaskListPage),
      },
      {
        path: 'pinned-tasks',
        loadComponent: () =>
          import('./features/pinned-tasks/pinned-tasks-page/pinned-tasks-page').then((m) => m.PinnedTasksPage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories-page/categories-page').then((m) => m.CategoriesPage),
      },
      {
        path: 'tags',
        loadComponent: () => import('./features/tags/tags-page/tags-page').then((m) => m.TagsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'ai-plan',
        loadComponent: () =>
          import('./features/ai-plan/ai-plan-page/ai-plan-page').then((m) => m.AiPlanPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
