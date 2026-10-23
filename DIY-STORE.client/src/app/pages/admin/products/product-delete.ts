import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/admin-api';
import { ProductDetail } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { isNotFound } from '../../../core/form-helpers';
import { extractErrors } from '../../../core/http-errors';

@Component({
  selector: 'app-product-delete',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './product-delete.html',
})
export class ProductDelete {
  private readonly api = inject(AdminApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flash = inject(Flash);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly product = signal<ProductDetail | null>(null);
  protected readonly notFound = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  constructor() {
    this.api.product(this.id).subscribe({
      next: product => this.product.set(product),
      error: (err: unknown) => {
        if (isNotFound(err)) this.notFound.set(true);
        else this.errors.set(extractErrors(err));
      },
    });
  }

  protected confirm(): void {
    this.busy.set(true);
    this.errors.set([]);

    this.api.deleteProduct(this.id).subscribe({
      next: () => {
        this.flash.set('Product deleted!');
        void this.router.navigate(['/admin/products']);
      },
      error: (err: unknown) => {
        this.errors.set(extractErrors(err));
        this.busy.set(false);
      },
    });
  }
}
