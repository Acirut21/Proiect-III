import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/admin-api';
import { CategoryDto } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { extractErrors } from '../../../core/http-errors';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink],
  templateUrl: './category-list.html',
})
export class CategoryList {
  private readonly api = inject(AdminApi);
  private readonly flash = inject(Flash);

  protected readonly categories = signal<CategoryDto[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(this.flash.consume());

  constructor() {
    this.api.categories().subscribe({
      next: categories => this.categories.set(categories),
      error: (err: unknown) => this.error.set(extractErrors(err)[0]),
    });
  }
}
