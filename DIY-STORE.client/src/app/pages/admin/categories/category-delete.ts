import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/admin-api';
import { CategoryDto } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { isNotFound } from '../../../core/form-helpers';
import { extractErrors } from '../../../core/http-errors';

@Component({
  selector: 'app-category-delete',
  imports: [RouterLink],
  templateUrl: './category-delete.html',
})
export class CategoryDelete {
  private readonly api = inject(AdminApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flash = inject(Flash);

  private readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly category = signal<CategoryDto | null>(null);
  protected readonly notFound = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  constructor() {
    this.api.category(this.id).subscribe({
      next: category => this.category.set(category),
      error: (err: unknown) => {
        if (isNotFound(err)) this.notFound.set(true);
        else this.errors.set(extractErrors(err));
      },
    });
  }

  protected confirm(): void {
    this.busy.set(true);
    this.errors.set([]);

    this.api.deleteCategory(this.id).subscribe({
      next: () => {
        this.flash.set('Category deleted!');
        void this.router.navigate(['/admin/categories']);
      },
      error: (err: unknown) => {
        this.errors.set(extractErrors(err));
        this.busy.set(false);
      },
    });
  }
}
