import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserInfo } from './auth.models';

const STORAGE_KEY = 'diystore.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<AuthResponse | null>(this.restore());

  readonly user = computed<UserInfo | null>(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.user()?.roles.includes('Admin') ?? false);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(tap(r => this.start(r)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', request).pipe(tap(r => this.start(r)));
  }

  /** Deconectare voita de utilizator. */
  logout(): void {
    this.clear();
    void this.router.navigateByUrl('/');
  }

  /** Sesiune expirata sau respinsa de server: curata si trimite la login. */
  expire(): void {
    this.clear();
    void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  /** Verifica daca exista o sesiune neexpirata; daca a expirat, o sterge. */
  hasValidSession(): boolean {
    const current = this.session();
    if (!current) return false;
    if (this.isExpired(current)) {
      this.clear();
      return false;
    }
    return true;
  }

  private start(response: AuthResponse): void {
    this.session.set(response);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    } catch {
      // stocarea poate fi indisponibila (mod privat); sesiunea ramane doar in memorie
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorat
    }
  }

  private restore(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthResponse;
      if (!parsed?.token || !parsed.user || this.isExpired(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private isExpired(response: AuthResponse): boolean {
    return new Date(response.expiresAt).getTime() <= Date.now();
  }
}
