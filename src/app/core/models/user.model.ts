export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  timezone: string;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  email: string;
  password: string;
  name: string;
  avatarUrl?: string | null;
  timezone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface UserUpdateRequest {
  name: string;
  avatarUrl?: string | null;
  timezone?: string | null;
  preferences?: Record<string, unknown>;
}

/** Locally remembered account, used to "continue as" a user on this device. */
export interface KnownAccount {
  id: string;
  email: string;
  name: string;
}
