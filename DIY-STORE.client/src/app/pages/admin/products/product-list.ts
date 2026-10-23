import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/admin-api';
import { ProductListItem } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { extractErrors } from '../../../core/http-errors';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly api = inject(AdminApi);
  private readonly flash = inject(Flash);

  protected readonly products = signal<ProductListItem[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(this.flash.consume());

  constructor() {
    this.api.products().subscribe({
      next: products => this.products.set(products),
      error: (err: unknown) => this.error.set(extractErrors(err)[0]),
    });
  }
}
