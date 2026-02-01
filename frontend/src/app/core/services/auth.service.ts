import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const NIT_KEY = 'auth_nit';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSignal = signal<string | null>(this.readToken());
  private nitSignal = signal<string | null>(this.readNit());

  setSession(nit: string, token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(NIT_KEY, nit);
    this.tokenSignal.set(token);
    this.nitSignal.set(nit);
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(NIT_KEY);
    this.tokenSignal.set(null);
    this.nitSignal.set(null);
  }

  get token() {
    return this.tokenSignal();
  }

  get nit() {
    return this.nitSignal();
  }

  isAuthenticated() {
    return !!this.tokenSignal();
  }

  private readToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readNit(): string | null {
    return localStorage.getItem(NIT_KEY);
  }
}
