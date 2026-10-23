import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApi } from '../../../core/admin-api';
import { CategoryDto } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { isNotFound, messageFor, notBlank } from '../../../core/form-helpers';
import { extractErrors } from '../../../core/http-errors';
import { ImageInput } from '../../../shared/image-input/image-input';

type Field = 'name' | 'slug';

const MESSAGES: Record<Field, Record<string, string>> = {
  name: {
    required: 'Category name is required.',
    minlength: 'Name must be between 2 and 100 characters.',
    maxlength: 'Name must be between 2 and 100 characters.',
  },
  slug: {
    required: 'Slug is required.',
    minlength: 'Slug must be between 2 and 100 characters.',
    maxlength: 'Slug must be between 2 and 100 characters.',
    pattern: 'Slug can only contain lowercase letters, numbers and hyphens.',
  },
};

/** Formular pentru adaugarea si editarea unei categorii (aceeasi pagina, dupa prezenta lui :id in ruta). */
@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, RouterLink, ImageInput],
  templateUrl: './category-form.html',
})
export class CategoryForm {
  private readonly api = inject(AdminApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flash = inject(Flash);

  private readonly categoryId = Number(this.route.snapshot.paramMap.get('id')) || null;

  protected readonly isEdit = this.categoryId !== null;
  protected readonly current = signal<CategoryDto | null>(null);
  protected readonly loading = signal(this.categoryId !== null);
  protected readonly notFound = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  private imageFile: File | null = null;

  protected readonly form = this.fb.group({
    name: ['', [notBlank, Validators.minLength(2), Validators.maxLength(100)]],
    slug: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-z0-9-]+$/)],
    ],
  });

  constructor() {
    if (this.categoryId === null) return;

    this.api.category(this.categoryId).subscribe({
      next: category => {
        this.current.set(category);
        this.form.patchValue({ name: category.name, slug: category.slug });
        this.loading.set(false);
      },
      error: (err: unknown) => {
        if (isNotFound(err)) this.notFound.set(true);
        else this.errors.set(extractErrors(err));
        this.loading.set(false);
      },
    });
  }

  protected error(field: Field): string | null {
    return messageFor(this.form.controls[field], MESSAGES[field]);
  }

  protected onImageChange(file: File | null): void {
    this.imageFile = file;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const data = new FormData();
    data.append('Name', value.name.trim());
    data.append('Slug', value.slug.trim());
    if (this.imageFile) data.append('Image', this.imageFile);

    this.busy.set(true);
    this.errors.set([]);

    const request =
      this.categoryId === null ? this.api.createCategory(data) : this.api.updateCategory(this.categoryId, data);

    request.subscribe({
      next: saved => {
        this.flash.set(`Category "${saved.name}" ${this.isEdit ? 'updated' : 'created'}!`);
        void this.router.navigate(['/admin/categories']);
      },
      error: (err: unknown) => {
        this.errors.set(extractErrors(err));
        this.busy.set(false);
      },
    });
  }
}
