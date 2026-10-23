import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { CatalogApi } from '../../core/catalog-api';
import { PublicCategory } from '../../core/catalog.models';
import { isNotFound } from '../../core/form-helpers';
import { extractErrors } from '../../core/http-errors';
import { ImageCarousel } from '../../shared/image-carousel/image-carousel';

/** Pagina unei categorii: subcategoriile ei, fiecare cu un buton catre lista de produse. */
@Component({
  selector: 'app-category-page',
  imports: [RouterLink, ImageCarousel],
  templateUrl: './category-page.html',
})
export class CategoryPage {
  private readonly api = inject(CatalogApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly category = signal<PublicCategory | null>(null);
  protected readonly notFound = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.loading.set(true);
          this.notFound.set(false);
          this.error.set(null);
          return this.api.category(params.get('slug') ?? '').pipe(
            map(category => ({ category })),
            catchError((err: unknown) => {
              if (isNotFound(err)) this.notFound.set(true);
              else this.error.set(extractErrors(err)[0]);
              return of({ category: null });
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ category }) => {
        this.category.set(category);
        this.loading.set(false);
      });
  }
}
