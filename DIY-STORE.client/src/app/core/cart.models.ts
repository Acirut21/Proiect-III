export type DeliveryMethodName = 'Courier' | 'StorePickup';

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface CartLine {
  productId: number;
  slug: string;
  name: string;
  imagePath: string | null;
  unitPrice: number;
  quantity: number;
  stock: number;
  subtotal: number;
  /** null, "OutOfStock" (stoc 0) sau "NotEnough" (cantitatea depaseste stocul). */
  problem: 'OutOfStock' | 'NotEnough' | null;
}

export interface DeliveryOption {
  method: DeliveryMethodName;
  cost: number;
}

export interface CartSummary {
  lines: CartLine[];
  removedProductIds: number[];
  subtotal: number;
  deliveryOptions: DeliveryOption[];
  deliveryMethod: DeliveryMethodName | null;
  shippingCost: number;
  total: number;
  deliveryConflict: boolean;
  canCheckout: boolean;
}

/** Datele minime ale unui produs de care are nevoie butonul "Add". */
export interface Purchasable {
  id: number;
  name: string;
  stock: number;
}
