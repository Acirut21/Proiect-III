import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, Purchasable } from './cart.models';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'diy-store.cart';

/**
 * Cosul de cumparaturi al browserului. Tine doar produsul si cantitatea; preturile si stocul se iau
 * mereu de pe server (CartApi), asa ca nu pot fi falsificate din browser.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly toast = inject(ToastService);

  readonly items = signal<readonly CartItem[]>(this.load());
  /** Numarul de produse distincte (nu de bucati), ca in insigna aplicatiei vechi. */
  readonly count = computed(() => this.items().length);

  quantityOf(productId: number): number {
    return this.items().find(i => i.productId === productId)?.quantity ?? 0;
  }

  /** Adauga in cos respectand stocul. Intoarce true daca s-a adaugat; altfel afiseaza motivul. */
  add(product: Purchasable, quantity = 1): boolean {
    const wanted = Math.floor(quantity);
    if (!(wanted >= 1)) {
      this.toast.show('Please enter a valid quantity.', 'warning');
      return false;
    }
    if (product.stock <= 0) {
      this.toast.show(`${product.name} is out of stock.`, 'danger');
      return false;
    }
    const existing = this.quantityOf(product.id);
    if (existing + wanted > product.stock) {
      const already = existing > 0 ? ` You already have ${existing} in your cart.` : '';
      this.toast.show(`Only ${product.stock} unit(s) available.${already}`, 'warning');
      return false;
    }
    this.commit(
      existing > 0
        ? this.items().map(i => (i.productId === product.id ? { ...i, quantity: existing + wanted } : i))
        : [...this.items(), { productId: product.id, quantity: wanted }],
    );
    this.toast.show(`${product.name} added to cart.`);
    return true;
  }

  setQuantity(productId: number, quantity: number): void {
    const q = Math.floor(quantity);
    if (!(q >= 1)) return;
    this.commit(this.items().map(i => (i.productId === productId ? { ...i, quantity: q } : i)));
  }

  remove(productId: number): void {
    this.removeMany([productId]);
  }

  removeMany(ids: readonly number[]): void {
    if (ids.length === 0) return;
    this.commit(this.items().filter(i => !ids.includes(i.productId)));
  }

  clear(): void {
    this.commit([]);
  }

  private commit(next: readonly CartItem[]): void {
    this.items.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Stocarea locala poate lipsi (mod privat); cosul ramane valabil cat timp pagina e deschisa.
    }
  }

  private load(): CartItem[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (i): i is CartItem =>
            !!i && Number.isInteger(i.productId) && Number.isInteger(i.quantity) && i.quantity >= 1,
        )
        .map(i => ({ productId: i.productId, quantity: i.quantity }));
    } catch {
      return [];
    }
  }
}
