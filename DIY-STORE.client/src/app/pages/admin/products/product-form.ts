import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AdminApi } from '../../../core/admin-api';
import { CategoryDto, DeliveryMethodName, ProductDetail } from '../../../core/admin.models';
import { Flash } from '../../../core/flash';
import { isNotFound, messageFor, notBlank, wholeNumber } from '../../../core/form-helpers';
import { extractErrors } from '../../../core/http-errors';
import { ImageInput } from '../../../shared/image-input/image-input';

type Field =
  | 'name'
  | 'description'
  | 'price'
  | 'previousPrice'
  | 'stock'
  | 'subcategoryId'
  | 'manufacturerName'
  | 'delivery';

type SpecGroup = FormGroup<{ name: FormControl<string>; value: FormControl<string> }>;

interface ImageRow {
  key: number;
  file: File | null;
}

// Aceleasi mesaje ca la validarea de pe server
const MESSAGES: Record<Field, Record<string, string>> = {
  name: {
    required: 'Product name is required.',
    minlength: 'Name must be between 2 and 200 characters.',
    maxlength: 'Name must be between 2 and 200 characters.',
  },
  description: {
    maxlength: 'Description cannot exceed 2000 characters.',
  },
  price: {
    required: 'Price is required.',
    min: 'Price must be between 0.01 and 99999.99 RON.',
    max: 'Price must be between 0.01 and 99999.99 RON.',
  },
  previousPrice: {
    min: 'Old price must be between 0 and 99999.99 RON.',
    max: 'Old price must be between 0 and 99999.99 RON.',
  },
  stock: {
    required: 'Stock quantity is required.',
    min: 'Stock must be between 0 and 100000.',
    max: 'Stock must be between 0 and 100000.',
    integer: 'Stock must be a whole number.',
  },
  subcategoryId: {
    required: 'Please select a subcategory.',
  },
  manufacturerName: {
    maxlength: 'Manufacturer name cannot exceed 100 characters.',
  },
  delivery: {
    required: 'Select at least one delivery method.',
  },
};

/** Cel putin o modalitate de livrare trebuie bifata. */
const atLeastOneDelivery: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const value = group.value as { courier: boolean; storePickup: boolean };
  return value.courier || value.storePickup ? null : { required: true };
};

/** Formular pentru adaugarea si editarea unui produs (aceeasi pagina, dupa prezenta lui :id in ruta). */
@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, ImageInput],
  templateUrl: './product-form.html',
})
export class ProductForm {
  private readonly api = inject(AdminApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly flash = inject(Flash);

  private readonly productId = Number(this.route.snapshot.paramMap.get('id')) || null;

  protected readonly isEdit = this.productId !== null;
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly hasSubcategories = computed(() => this.categories().some(c => c.subcategories.length > 0));
  protected readonly current = signal<ProductDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);

  /** Un rand pentru fiecare imagine noua; prima imagine din lista devine imaginea principala. */
  protected readonly imageRows = signal<ImageRow[]>([{ key: 1, file: null }]);
  private nextImageKey = 2;
  private logoFile: File | null = null;

  protected readonly form = this.fb.group({
    name: ['', [notBlank, Validators.minLength(2), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(2000)],
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.max(99999.99)]),
    previousPrice: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(99999.99)]),
    stock: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100000),
      wholeNumber,
    ]),
    subcategoryId: this.fb.control<number | null>(null, Validators.required),
    manufacturerName: ['', Validators.maxLength(100)],
    isOnSale: [false],
    delivery: this.fb.group({ courier: [true], storePickup: [false] }, { validators: atLeastOneDelivery }),
    specifications: this.fb.array<SpecGroup>([]),
  });

  constructor() {
    forkJoin({
      categories: this.api.categories(),
      product: this.productId === null ? of(null) : this.api.product(this.productId),
    }).subscribe({
      next: ({ categories, product }) => {
        this.categories.set(categories);

        if (product) {
          this.current.set(product);
          this.form.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            previousPrice: product.previousPrice,
            stock: product.stock,
            subcategoryId: product.subcategoryId,
            manufacturerName: product.manufacturerName,
            isOnSale: product.isOnSale,
            delivery: {
              courier: product.deliveryMethods.includes('Courier'),
              storePickup: product.deliveryMethods.includes('StorePickup'),
            },
          });
          for (const spec of product.specifications) this.addSpecification(spec.name, spec.value);
        }

        // Un rand gol de specificatii ca sa se vada ca pot fi adaugate
        if (this.form.controls.specifications.length === 0) this.addSpecification();
        this.loading.set(false);
      },
      error: (err: unknown) => {
        if (isNotFound(err)) this.notFound.set(true);
        else this.errors.set(extractErrors(err));
        this.loading.set(false);
      },
    });
  }

  protected get specifications() {
    return this.form.controls.specifications;
  }

  protected error(field: Field): string | null {
    return messageFor(this.form.controls[field], MESSAGES[field]);
  }

  /** O specificatie trebuie completata integral (nume si valoare) sau lasata complet goala. */
  protected specificationsError(): string | null {
    if (!this.submitted()) return null;

    const incomplete = this.specifications.controls.some(group => {
      const { name, value } = group.getRawValue();
      return name.trim().length > 0 !== value.trim().length > 0;
    });
    return incomplete ? 'Each specification needs both a name and a value.' : null;
  }

  protected addSpecification(name = '', value = ''): void {
    this.specifications.push(
      this.fb.group({
        name: [name, Validators.maxLength(100)],
        value: [value, Validators.maxLength(300)],
      }),
    );
  }

  protected removeSpecification(index: number): void {
    this.specifications.removeAt(index);
  }

  protected addImageRow(): void {
    this.imageRows.update(rows => [...rows, { key: this.nextImageKey++, file: null }]);
  }

  protected removeImageRow(key: number): void {
    this.imageRows.update(rows => rows.filter(row => row.key !== key));
  }

  protected setImage(key: number, file: File | null): void {
    this.imageRows.update(rows => rows.map(row => (row.key === key ? { ...row, file } : row)));
  }

  protected onLogoChange(file: File | null): void {
    this.logoFile = file;
  }

  protected submit(): void {
    this.submitted.set(true);

    if (this.form.invalid || this.specificationsError()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const data = new FormData();
    data.append('Name', value.name.trim());
    data.append('Description', value.description.trim());
    data.append('Price', String(value.price));
    if (value.previousPrice !== null) data.append('PreviousPrice', String(value.previousPrice));
    data.append('IsOnSale', String(value.isOnSale));
    data.append('Stock', String(value.stock));
    data.append('ManufacturerName', value.manufacturerName.trim());
    data.append('SubcategoryId', String(value.subcategoryId));

    const delivery: DeliveryMethodName[] = [];
    if (value.delivery.courier) delivery.push('Courier');
    if (value.delivery.storePickup) delivery.push('StorePickup');
    for (const method of delivery) data.append('DeliveryMethods', method);

    // Randurile complet goale se ignora; indicii trebuie sa fie consecutivi (0, 1, 2, ...)
    value.specifications
      .map(spec => ({ name: spec.name.trim(), value: spec.value.trim() }))
      .filter(spec => spec.name.length > 0 && spec.value.length > 0)
      .forEach((spec, index) => {
        data.append(`Specifications[${index}].Name`, spec.name);
        data.append(`Specifications[${index}].Value`, spec.value);
      });

    for (const row of this.imageRows()) {
      if (row.file) data.append('Images', row.file);
    }
    if (this.logoFile) data.append('ManufacturerLogo', this.logoFile);

    this.busy.set(true);
    this.errors.set([]);

    const request =
      this.productId === null ? this.api.createProduct(data) : this.api.updateProduct(this.productId, data);

    request.subscribe({
      next: saved => {
        this.flash.set(`✅ Product "${saved.name}" ${this.isEdit ? 'updated' : 'created'}!`);
        void this.router.navigate(['/admin/products']);
      },
      error: (err: unknown) => {
        this.errors.set(extractErrors(err));
        this.busy.set(false);
      },
    });
  }
}
