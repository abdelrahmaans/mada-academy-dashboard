import { Injectable, signal } from '@angular/core';
import type { AuthTokens } from './auth.models';

const REFRESH_TOKEN_KEY = 'mada.angular.refreshToken';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly accessTokenState = signal<string | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();

  hasRefreshToken(): boolean {
    return this.readRefreshToken() !== null;
  }

  save(tokens: AuthTokens): void {
    this.accessTokenState.set(tokens.accessToken);
    this.storage()?.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  readRefreshToken(): string | null {
    return this.storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  }

  clear(): void {
    this.accessTokenState.set(null);
    this.storage()?.removeItem(REFRESH_TOKEN_KEY);
  }

  private storage(): Storage | null {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  }
}
