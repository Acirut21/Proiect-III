import { Component, inject, input, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { FavoritesService } from '../../core/favorites.service';

/** Inimioara de favorite. Apare doar pentru utilizatorii autentificati, ca in aplicatia veche. */
@Component({
  selector: 'app-favorite-button',
  templateUrl: './favorite-button.html',
})
export class FavoriteButton {
  protected readonly auth = inject(AuthService);
  protected readonly favorites = inject(FavoritesService);

  readonly productId = input.required<number>();
  protected readonly busy = signal(false);

  protected toggle(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.favorites.toggle(this.productId()).subscribe({
      next: () => this.busy.set(false),
      error: () => this.busy.set(false),
    });
  }
}
