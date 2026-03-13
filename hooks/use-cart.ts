"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  addItemToCart,
  getCartSummary,
  removeCartItem,
  updateCartItemQuantity,
  type AddCartItemInput,
  type CartItem,
} from "@/lib/pos/cart-utils";

const CART_STORAGE_KEY = "utang-pos-cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        setItems(
          parsed.filter(
            (item) =>
              typeof item.productId === "string" &&
              typeof item.name === "string" &&
              typeof item.price === "number" &&
              typeof item.quantity === "number"
          )
        );
      }
      setIsHydrated(true);
    } catch {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, isHydrated]);

  const addItem = useCallback((item: AddCartItemInput) => {
    setItems((prev) => addItemToCart(prev, item));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => updateCartItemQuantity(prev, productId, quantity));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => removeCartItem(prev, productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { subtotal, taxAmount, totalAmount, itemCount } = useMemo(
    () => getCartSummary(items),
    [items]
  );

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxAmount,
    totalAmount,
    itemCount,
    isHydrated,
  };
}
