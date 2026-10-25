import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { CatalogApi } from '../../core/catalog-api';
import { ProductPage } from '../../core/catalog.models';
import { extractErrors } from '../../core/http-errors';
import { ProductCard } from '../../shared/product-card/product-card';

/** Rezultatele cautarii (/search?q=...): toate produsele al caror nume sau descriere contine textul. */
@Component({
  selector: 'app-search-results',
  imports: [ProductCard],
  templateUrl: './search-results.html',
})
export class SearchResults {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly page = signal<ProductPage | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(
        tap(() => {
          this.page.set(null);
          this.error.set(null);
        }),
        switchMap(params =>
          this.api.search(params.get('q') ?? '').pipe(
            catchError((err: unknown) => {
              this.error.set(extractErrors(err)[0]);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => this.page.set(result));
  }
}
