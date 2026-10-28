import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../core/catalog.models';
import { FavoritesService } from '../../core/favorites.service';
import { extractErrors } from '../../core/http-errors';
import { ProductCard as ProductCardComponent } from '../../shared/product-card/product-card';

/** "My Favorites": produsele adaugate la favorite; scoaterea unui produs il elimina imediat din lista. */
@Component({
  selector: 'app-favorites',
  imports: [RouterLink, ProductCardComponent],
  templateUrl: './favorites.html',
})
export class Favorites {
  protected readonly favorites = inject(FavoritesService);

  protected readonly products = signal<ProductCard[] | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.favorites.list().subscribe({
      next: list => this.products.set(list),
      error: (err: unknown) => this.error.set(extractErrors(err)[0]),
    });
  }

  /** Produsele afisate: dupa ce un produs este scos de la favorite, dispare din lista fara reincarcare. */
  protected readonly visible = computed(() => {
    const list = this.products();
    if (list === null) return null;
    return this.favorites.ready() ? list.filter(p => this.favorites.isFavorite(p.id)) : list;
  });
}
