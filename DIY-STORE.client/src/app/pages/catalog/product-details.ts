import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { CatalogApi } from '../../core/catalog-api';
import { ProductDetailPage } from '../../core/catalog.models';
import { isNotFound } from '../../core/form-helpers';
import { extractErrors } from '../../core/http-errors';
import { ImageCarousel } from '../../shared/image-carousel/image-carousel';
import { ProductCard } from '../../shared/product-card/product-card';

const DELIVERY_LABELS: Record<string, string> = { Courier: 'Courier', StorePickup: 'Store pickup' };

/** Pagina unui produs: galerie, pret, stoc, specificatii, descriere si produse similare. */
@Component({
  selector: 'app-product-details',
  imports: [RouterLink, DecimalPipe, ImageCarousel, ProductCard],
  templateUrl: './product-details.html',
})
export class ProductDetails {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly product = signal<ProductDetailPage | null>(null);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(true);

  /** Reducerea afisata: doar la produsele "On Sale" care au pret vechi. */
  protected readonly discount = computed(() => {
    const p = this.product();
    if (!p || !p.isOnSale || p.previousPrice === null || p.previousPrice <= 0) return null;
    return Math.round((1 - p.price / p.previousPrice) * 100);
  });

  protected readonly deliveryText = computed(() =>
    (this.product()?.deliveryMethods ?? []).map(m => DELIVERY_LABELS[m] ?? m).join(', '),
  );

  protected readonly quickSpecs = computed(() => (this.product()?.specifications ?? []).slice(0, 4));

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.loading.set(true);
          this.notFound.set(false);
          this.error.set(null);
          return this.api.product(params.get('slug') ?? '').pipe(
            map(product => ({ product })),
            catchError((err: unknown) => {
              if (isNotFound(err)) this.notFound.set(true);
              else this.error.set(extractErrors(err)[0]);
              return of({ product: null });
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ product }) => {
        this.product.set(product);
        this.loading.set(false);
      });
  }
}
