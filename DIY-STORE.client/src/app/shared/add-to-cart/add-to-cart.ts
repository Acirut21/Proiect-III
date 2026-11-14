import { Component, inject, input } from '@angular/core';
import { CartService } from '../../core/cart.service';
import { Purchasable } from '../../core/cart.models';

/** Butonul "Add to cart"; cu `withQuantity` afiseaza si un selector de cantitate (pagina produsului). */
@Component({
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.html',
})
export class AddToCart {
  private readonly cart = inject(CartService);

  readonly product = input.required<Purchasable>();
  readonly withQuantity = input(false);

  protected add(quantity: string): void {
    const q = this.withQuantity() ? Number(quantity) : 1;
    this.cart.add(this.product(), q);
  }
}
