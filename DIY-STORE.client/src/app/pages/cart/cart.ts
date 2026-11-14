import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, combineLatest, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CartApi } from '../../core/cart-api';
import { CartLine, CartSummary, DeliveryMethodName } from '../../core/cart.models';
import { CartService } from '../../core/cart.service';
import { extractErrors } from '../../core/http-errors';

const DELIVERY_LABELS: Record<DeliveryMethodName, string> = { Courier: 'Courier', StorePickup: 'Store pickup' };

/** Pagina cosului: cantitati, avertismente de stoc, metoda de livrare si totalul calculat de server. */
@Component({
  selector: 'app-cart',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './cart.html',
})
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  private readonly api = inject(CartApi);
  private readonly destroyRef = inject(DestroyRef);

  /** Ultimul calcul primit; ramane afisat cat timp se recalculeaza, ca pagina sa nu palpaie. */
  protected readonly summary = signal<CartSummary | null>(null);
  protected readonly loaded = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Metoda aleasa de utilizator; null = prima disponibila (alege serverul). */
  protected readonly chosenMethod = signal<DeliveryMethodName | null>(null);

  constructor() {
    combineLatest([toObservable(this.cart.items), toObservable(this.chosenMethod)])
      .pipe(
        switchMap(([items, method]) => {
          if (items.length === 0) {
            this.summary.set(null);
            this.error.set(null);
            this.loaded.set(true);
            return of(null);
          }
          return this.api.summary(items, method).pipe(
            tap(() => this.error.set(null)),
            catchError((err: unknown) => {
              this.error.set(extractErrors(err)[0]);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(result => {
        if (result) {
          this.summary.set(result);
          this.loaded.set(true);
          // Produsele sterse intre timp din magazin dispar si din cos
          this.cart.removeMany(result.removedProductIds);
        } else if (this.error()) {
          this.loaded.set(true);
        }
      });
  }

  protected label(method: DeliveryMethodName): string {
    return DELIVERY_LABELS[method];
  }

  protected changeQuantity(line: CartLine, raw: string, input: HTMLInputElement): void {
    let q = Math.floor(Number(raw));
    if (!(q >= 1)) q = 1;
    if (line.stock > 0 && q > line.stock) q = line.stock;
    input.value = String(q);
    this.cart.setQuantity(line.productId, q);
  }

  protected remove(line: CartLine): void {
    this.cart.remove(line.productId);
  }
}
