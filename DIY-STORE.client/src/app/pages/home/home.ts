import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogApi } from '../../core/catalog-api';
import { HomeData } from '../../core/catalog.models';
import { extractErrors } from '../../core/http-errors';
import { ImageCarousel } from '../../shared/image-carousel/image-carousel';
import { ProductCard } from '../../shared/product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ImageCarousel, ProductCard],
  templateUrl: './home.html',
})
export class Home {
  private readonly api = inject(CatalogApi);

  protected readonly data = signal<HomeData | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.api.home().subscribe({
      next: data => this.data.set(data),
      error: (err: unknown) => this.error.set(extractErrors(err)[0]),
    });
  }
}
