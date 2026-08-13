import { Injectable, computed, inject, signal } from '@angular/core';
import { KnownAccount, LoginRequest, UserCreateRequest, UserDto } from '../models/user.model';
import { AuthApiService } from './auth-api.service';
import { clearToken, decodeJwtPayload, getToken, setToken } from './token-storage';
import { UserService } from './user.service';

const ACCOUNTS_KEY = 'tms.accounts';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);
  private readonly authApi = inject(AuthApiService);

  readonly currentUser = signal<UserDto | null>(null);
  readonly initializing = signal(true);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  readonly knownAccounts = signal<KnownAccount[]>(this.readAccounts());

  async restoreSession(): Promise<void> {
    const token = getToken();
    if (!token) {
      this.initializing.set(false);
      return;
    }
    const payload = decodeJwtPayload(token);
    if (!payload) {
      clearToken();
      this.initializing.set(false);
      return;
    }
    try {
      const user = await this.userService.findById(payload.sub);
      this.currentUser.set(user);
      this.rememberAccount(user);
    } catch {
      clearToken();
    } finally {
      this.initializing.set(false);
    }
  }

  async signUp(request: UserCreateRequest): Promise<UserDto> {
    const response = await this.authApi.register(request);
    this.startSession(response.token, response.user);
    return response.user;
  }

  async login(request: LoginRequest): Promise<UserDto> {
    const response = await this.authApi.login(request);
    this.startSession(response.token, response.user);
    return response.user;
  }

  forgotPassword(email: string): Promise<void> {
    return this.authApi.forgotPassword({ email });
  }

  signOut(): void {
    clearToken();
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

  private startSession(token: string, user: UserDto): void {
    setToken(token);
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
