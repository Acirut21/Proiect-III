import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AdminApi } from '../../../core/admin-api';
import { CategoryDto, SubcategoryDto } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { isNotFound, messageFor, notBlank } from '../../../core/form-helpers';
import { extractErrors } from '../../../core/http-errors';
import { ImageInput } from '../../../shared/image-input/image-input';

type Field = 'categoryId' | 'name';

const MESSAGES: Record<Field, Record<string, string>> = {
  categoryId: {
    required: 'Please select a parent category.',
  },
  name: {
    required: 'Subcategory name is required.',
    minlength: 'Name must be between 2 and 100 characters.',
    maxlength: 'Name must be between 2 and 100 characters.',
  },
};

/** Formular pentru adaugarea si editarea unei subcategorii (aceeasi pagina, dupa prezenta lui :id in ruta). */
@Component({
  selector: 'app-subcategory-form',
  imports: [ReactiveFormsModule, RouterLink, ImageInput],
  templateUrl: './subcategory-form.html',
})
export class SubcategoryForm {
  private readonly api = inject(AdminApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flash = inject(Flash);

  private readonly subcategoryId = Number(this.route.snapshot.paramMap.get('id')) || null;

  protected readonly isEdit = this.subcategoryId !== null;
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly current = signal<SubcategoryDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);

  private imageFile: File | null = null;

  protected readonly form = this.fb.group({
    categoryId: this.fb.control<number | null>(null, Validators.required),
    name: ['', [notBlank, Validators.minLength(2), Validators.maxLength(100)]],
  });

  constructor() {
    forkJoin({
      categories: this.api.categories(),
      subcategory: this.subcategoryId === null ? of(null) : this.api.subcategory(this.subcategoryId),
    }).subscribe({
      next: ({ categories, subcategory }) => {
        this.categories.set(categories);
        if (subcategory) {
          this.current.set(subcategory);
          this.form.patchValue({ categoryId: subcategory.categoryId, name: subcategory.name });
        }
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
    data.append('CategoryId', String(value.categoryId));
    data.append('Name', value.name.trim());
    if (this.imageFile) data.append('Image', this.imageFile);

    this.busy.set(true);
    this.errors.set([]);

    const request =
      this.subcategoryId === null
        ? this.api.createSubcategory(data)
        : this.api.updateSubcategory(this.subcategoryId, data);

    request.subscribe({
      next: saved => {
        this.flash.set(`Subcategory "${saved.name}" ${this.isEdit ? 'updated' : 'created'}!`);
        void this.router.navigate(['/admin/categories']);
      },
      error: (err: unknown) => {
        this.errors.set(extractErrors(err));
        this.busy.set(false);
      },
    });
  }
}
