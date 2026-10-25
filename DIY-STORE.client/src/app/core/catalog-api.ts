import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  HomeData,
  ProductDetailPage,
  ProductPage,
  ProductQuery,
  PublicCategory,
} from './catalog.models';

/** Apelurile catre API-ul public de rasfoire (fara autentificare). */
@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);

  categories(): Observable<PublicCategory[]> {
    return this.http.get<PublicCategory[]>('/api/catalog/categories');
  }

  category(slug: string): Observable<PublicCategory> {
    return this.http.get<PublicCategory>(`/api/catalog/categories/${encodeURIComponent(slug)}`);
  }

  home(): Observable<HomeData> {
    return this.http.get<HomeData>('/api/catalog/home');
  }

  products(query: ProductQuery): Observable<ProductPage> {
    return this.http.get<ProductPage>('/api/catalog/products', { params: toParams(query) });
  }

  promotions(query: ProductQuery): Observable<ProductPage> {
    return this.http.get<ProductPage>('/api/catalog/promotions', { params: toParams(query) });
  }

  search(q: string): Observable<ProductPage> {
    return this.http.get<ProductPage>('/api/catalog/search', { params: toParams({ q } as ProductQuery) });
  }

  product(slug: string): Observable<ProductDetailPage> {
    return this.http.get<ProductDetailPage>(`/api/catalog/products/${encodeURIComponent(slug)}`);
  }
}

function toParams(query: ProductQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params = params.set(key, value);
  }
  return params;
}
