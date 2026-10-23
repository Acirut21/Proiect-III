import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, merge, of, switchMap, tap } from 'rxjs';
import { CatalogApi } from '../../core/catalog-api';
import { ProductPage, ProductQuery, PublicCategory } from '../../core/catalog.models';
import { extractErrors } from '../../core/http-errors';
import { ProductCard } from '../../shared/product-card/product-card';

/**
 * Lista de produse. Aceeasi pagina serveste "/products" (cu filtre pe categorie, subcategorie, pret,
 * "On Sale only") si "/promotions" (doar produse la reducere, cu filtru pe categorie).
 * Filtrele traiesc in adresa (?cat=...&sub=...&page=2), deci paginile se pot distribui prin link.
 */
@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule, RouterLink, ProductCard],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isPromotions = this.route.snapshot.data['promotions'] === true;
  protected readonly pageSizes = [4, 8, 12];

  protected readonly page = signal<ProductPage | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly categories = signal<PublicCategory[]>([]);

  protected readonly filters = this.fb.group({
    perPage: ['12'],
    onSale: [false],
    cat: [''],
    minPrice: [''],
    maxPrice: [''],
  });

  private current: Params = {};

  constructor() {
    if (this.isPromotions) {
      this.api.categories().subscribe({ next: list => this.categories.set(list), error: () => undefined });
    }

    // Marimea paginii, "On Sale only" si categoria se aplica imediat; preturile cu butonul Apply
    merge(
      this.filters.controls.perPage.valueChanges,
      this.filters.controls.onSale.valueChanges,
      this.filters.controls.cat.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.apply());

    this.route.queryParams
      .pipe(
        tap(query => {
          this.current = query;
          this.error.set(null);
          this.page.set(null);
          this.filters.patchValue({
            perPage: query['perPage'] ?? '12',
            onSale: query['onSale'] === 'true',
            cat: query['cat'] ?? '',
            minPrice: query['minPrice'] ?? '',
            maxPrice: query['maxPrice'] ?? '',
          }, { emitEvent: false });
        }),
        switchMap(query => {
          const request = this.isPromotions ? this.api.promotions(query as ProductQuery) : this.api.products(query as ProductQuery);
          return request.pipe(
            catchError((err: unknown) => {
              this.error.set(extractErrors(err)[0]);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        this.page.set(result);
        // Afisam marimea reala a paginii (serverul accepta doar 4, 8 sau 12)
        if (result) this.filters.patchValue({ perPage: String(result.perPage) }, { emitEvent: false });
      });
  }

  protected get start(): number {
    const p = this.page();
    return p ? (p.page - 1) * p.perPage + 1 : 0;
  }

  protected get end(): number {
    const p = this.page();
    return p ? Math.min(p.page * p.perPage, p.totalCount) : 0;
  }

  protected pages(): number[] {
    return Array.from({ length: this.page()?.totalPages ?? 0 }, (_, i) => i + 1);
  }

  /** Aplica filtrele: pastreaza categoria/subcategoria din adresa si revine la prima pagina. */
  protected apply(): void {
    const value = this.filters.getRawValue();
    const query: Params = {};

    if (!this.isPromotions) {
      if (this.current['cat']) query['cat'] = this.current['cat'];
      if (this.current['sub']) query['sub'] = this.current['sub'];
      if (value.onSale) query['onSale'] = 'true';
    } else if (value.cat) {
      query['cat'] = value.cat;
    }

    if (value.perPage !== '12') query['perPage'] = value.perPage;
    // Campurile de tip number dau numar (sau null cand sunt goale), nu text
    const minPrice = String(value.minPrice ?? '').trim();
    const maxPrice = String(value.maxPrice ?? '').trim();
    if (minPrice) query['minPrice'] = minPrice;
    if (maxPrice) query['maxPrice'] = maxPrice;

    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }
}
