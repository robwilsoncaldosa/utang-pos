"use client";

import { useCartContext } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { ShoppingCart, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CartSidebarProps = {
  className?: string;
  /** On mobile, show as full-screen overlay; pass true when sheet is open */
  isMobileFullScreen?: boolean;
  /** When set, show a close button (e.g. for mobile overlay) */
  onClose?: () => void;
  /** Called when user clicks Review & Checkout / Review */
  onReview?: () => void;
};

export function CartSidebar({
  className,
  isMobileFullScreen,
  onClose,
  onReview,
}: CartSidebarProps) {
  const {
    items,
    clearCart,
    updateQuantity,
    totalAmount,
  } = useCartContext();

  const isEmpty = items.length === 0;

  return (
    <aside
      className={cn(
        "flex flex-col border-l border-border bg-card shrink-0",
        "w-full md:w-80 lg:w-96",
        "h-full min-h-0",
        isMobileFullScreen && "fixed inset-0 z-50 md:relative md:inset-auto",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <ShoppingCart className="size-5 text-[hsl(30,80%,50%)]" />
          Current Order
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Clear Order
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full hover:bg-muted md:hidden"
              aria-label="Close cart"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex flex-col p-4">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="rounded-full bg-muted p-6">
              <ShoppingCart className="size-12 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Your cart is empty
            </p>
            <p className="text-xs text-muted-foreground/80">
              Add products from the menu to start an order
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    P{item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="size-7 rounded border border-border text-xs font-medium hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="size-7 rounded border border-border text-xs font-medium hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Summary & actions */}
      <div className="shrink-0 border-t border-border p-4 space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between font-semibold text-foreground pt-1">
            <span>Total Amount</span>
            <span className="text-primary">P{totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-lg bg-muted text-foreground hover:bg-muted/80"
          >
            Hold Order
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-lg bg-[hsl(30,80%,50%)] text-white hover:bg-[hsl(30,80%,45%)]"
            disabled={isEmpty}
            onClick={onReview}
          >
            Review & Checkout
          </Button>
        </div>
      </div>
    </aside>
  );
}
