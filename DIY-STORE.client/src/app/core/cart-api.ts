import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CartItem, CartSummary, DeliveryMethodName } from './cart.models';

/** Calculul cosului pe server: preturile si stocul reale, metodele de livrare comune si totalul. */
@Injectable({ providedIn: 'root' })
export class CartApi {
  private readonly http = inject(HttpClient);

  summary(items: readonly CartItem[], deliveryMethod: DeliveryMethodName | null): Observable<CartSummary> {
    return this.http.post<CartSummary>('/api/cart/summary', {
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      deliveryMethod,
    });
  }
}
