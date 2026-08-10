import { Injectable, computed, inject, signal } from '@angular/core';
import { KnownAccount, UserCreateRequest, UserDto } from '../models/user.model';
import { UserService } from './user.service';

const SESSION_KEY = 'tms.session.userId';
const ACCOUNTS_KEY = 'tms.accounts';

/**
 * The backend has no login/session endpoints (only user CRUD), so "auth" here is a
 * device-local convenience: the current user's id is kept in localStorage and the
 * matching profile is (re)loaded from the API. Good enough for a single-device demo,
 * not a real authentication system.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);

  readonly currentUser = signal<UserDto | null>(null);
  readonly initializing = signal(true);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  readonly knownAccounts = signal<KnownAccount[]>(this.readAccounts());

  async restoreSession(): Promise<void> {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) {
      this.initializing.set(false);
      return;
    }
    try {
      const user = await this.userService.findById(userId);
      this.currentUser.set(user);
      this.rememberAccount(user);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      this.initializing.set(false);
    }
  }

  async signUp(request: UserCreateRequest): Promise<UserDto> {
    const user = await this.userService.create(request);
    this.startSession(user);
    return user;
  }

  async continueAs(userId: string): Promise<UserDto> {
    const user = await this.userService.findById(userId);
    this.startSession(user);
    return user;
  }

  signOut(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
  }

  forgetAccount(userId: string): void {
    const remaining = this.knownAccounts().filter((a) => a.id !== userId);
    this.knownAccounts.set(remaining);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(remaining));
  }

  updateCurrentUser(user: UserDto): void {
    this.currentUser.set(user);
    this.rememberAccount(user);
  }

  private startSession(user: UserDto): void {
    localStorage.setItem(SESSION_KEY, user.id);
    this.currentUser.set(user);
    this.rememberAccount(user);
  }

  private rememberAccount(user: UserDto): void {
    const accounts = this.knownAccounts().filter((a) => a.id !== user.id);
    accounts.unshift({ id: user.id, email: user.email, name: user.name });
    const trimmed = accounts.slice(0, 5);
    this.knownAccounts.set(trimmed);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(trimmed));
  }

  private readAccounts(): KnownAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      return raw ? (JSON.parse(raw) as KnownAccount[]) : [];
    } catch {
      return [];
    }
  }
}
