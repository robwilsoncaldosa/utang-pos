import { VAT_PERCENT } from "@/lib/constants";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  maxStock?: number;
};

export type AddCartItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

export function clampQuantity(nextQuantity: number, maxStock?: number) {
  if (maxStock === undefined) {
    return nextQuantity;
  }
  return Math.min(nextQuantity, Math.max(maxStock, 0));
}

export function addItemToCart(prev: CartItem[], item: AddCartItemInput) {
  const existing = prev.find((entry) => entry.productId === item.productId);
  const qty = item.quantity ?? 1;
  if (existing) {
    const quantity = clampQuantity(existing.quantity + qty, item.maxStock ?? existing.maxStock);
    if (quantity < 1) return prev;
    return prev.map((entry) =>
      entry.productId === item.productId ? { ...entry, ...item, quantity } : entry
    );
  }
  const quantity = clampQuantity(qty, item.maxStock);
  if (quantity < 1) return prev;
  return [...prev, { ...item, quantity }];
}

export function updateCartItemQuantity(prev: CartItem[], productId: string, quantity: number) {
  if (quantity < 1) {
    return prev.filter((entry) => entry.productId !== productId);
  }
  return prev.map((entry) =>
    entry.productId === productId
      ? { ...entry, quantity: clampQuantity(quantity, entry.maxStock) }
      : entry
  );
}

export function removeCartItem(prev: CartItem[], productId: string) {
  return prev.filter((entry) => entry.productId !== productId);
}

export function getCartSummary(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal * (VAT_PERCENT / 100);
  const totalAmount = subtotal + taxAmount;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  return { subtotal, taxAmount, totalAmount, itemCount };
}
