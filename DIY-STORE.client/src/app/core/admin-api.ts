import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryDto, ProductDetail, ProductListItem, SubcategoryDto } from './admin.models';

/** Apelurile catre API-ul de administrare. Formularele cu imagini se trimit ca FormData (multipart). */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);

  // ── Categorii ──
  categories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>('/api/admin/categories');
  }

  category(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`/api/admin/categories/${id}`);
  }

  createCategory(data: FormData): Observable<CategoryDto> {
    return this.http.post<CategoryDto>('/api/admin/categories', data);
  }

  updateCategory(id: number, data: FormData): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`/api/admin/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/categories/${id}`);
  }

  // ── Subcategorii ──
  subcategory(id: number): Observable<SubcategoryDto> {
    return this.http.get<SubcategoryDto>(`/api/admin/subcategories/${id}`);
  }

  createSubcategory(data: FormData): Observable<SubcategoryDto> {
    return this.http.post<SubcategoryDto>('/api/admin/subcategories', data);
  }

  updateSubcategory(id: number, data: FormData): Observable<SubcategoryDto> {
    return this.http.put<SubcategoryDto>(`/api/admin/subcategories/${id}`, data);
  }

  deleteSubcategory(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/subcategories/${id}`);
  }

  // ── Produse ──
  products(): Observable<ProductListItem[]> {
    return this.http.get<ProductListItem[]>('/api/admin/products');
  }

  product(id: number): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`/api/admin/products/${id}`);
  }

  createProduct(data: FormData): Observable<ProductDetail> {
    return this.http.post<ProductDetail>('/api/admin/products', data);
  }

  updateProduct(id: number, data: FormData): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`/api/admin/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/products/${id}`);
  }
}
