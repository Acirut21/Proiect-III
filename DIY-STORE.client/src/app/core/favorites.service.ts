import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { ProductCard } from './catalog.models';

/**
 * Starea favoritelor utilizatorului curent. Se incarca la autentificare si se goleste la deconectare,
 * ca inimile din liste sa arate mereu situatia reala fara un apel pentru fiecare card.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly favoriteIds = signal<ReadonlySet<number>>(new Set());
  /** Adevarat dupa ce id-urile favoritelor au fost incarcate de pe server. */
  readonly ready = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) this.refresh();
      else {
        this.favoriteIds.set(new Set());
        this.ready.set(false);
      }
    });
  }

  isFavorite(productId: number): boolean {
    return this.favoriteIds().has(productId);
  }

  list(): Observable<ProductCard[]> {
    return this.http.get<ProductCard[]>('/api/favorites');
  }

  /** Adauga sau scoate produsul; actualizeaza imediat inimile din toate paginile. */
  toggle(productId: number): Observable<{ isFavorite: boolean }> {
    return this.http.post<{ isFavorite: boolean }>(`/api/favorites/${productId}/toggle`, {}).pipe(
      tap(result =>
        this.favoriteIds.update(current => {
          const next = new Set(current);
          if (result.isFavorite) next.add(productId);
          else next.delete(productId);
          return next;
        }),
      ),
    );
  }

  private refresh(): void {
    this.http.get<number[]>('/api/favorites/ids').subscribe({
      next: ids => {
        this.favoriteIds.set(new Set(ids));
        this.ready.set(true);
      },
      error: () => undefined,
    });
  }
}
