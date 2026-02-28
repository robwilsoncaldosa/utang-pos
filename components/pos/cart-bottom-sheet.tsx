"use client";

import { useState, useCallback } from "react";
import { useCartContext } from "./cart-provider";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CartBottomSheetProps = {
  onReview: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
};

export function CartBottomSheet({
  onReview,
  expanded: controlledExpanded,
  onExpandedChange,
  className,
}: CartBottomSheetProps) {
  const {
    items,
    clearCart,
    updateQuantity,
    totalAmount,
  } = useCartContext();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setExpanded = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof v === "function" ? v(expanded) : v;
      onExpandedChange?.(next);
      if (controlledExpanded === undefined) setInternalExpanded(next);
    },
    [controlledExpanded, expanded, onExpandedChange]
  );
  const isEmpty = items.length === 0;
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const summaryLabel = items.length > 0 ? items[0].name : "Cart";
  if (items.length > 1) {
    // show "SoftDrinks" style - could be category or "X items"
  }

  if (isEmpty) return null;

  return (
    <Drawer open={expanded} onOpenChange={setExpanded} shouldScaleBackground={false}>
      {!expanded && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
            className,
          )}
        >
          <div className="shrink-0 px-4 pb-3 pt-3">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full flex flex-col items-center gap-2"
              aria-label="Expand cart"
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              <div className="w-full text-left text-xs text-muted-foreground space-y-0.5">
                <p>
                  Product Name: {summaryLabel}
                  {itemCount > 1 ? ` +${itemCount - 1} more` : ""}
                </p>
                <p>Product Quantity: {itemCount}</p>
                <p className="font-semibold text-foreground">
                  Total Amount: P{totalAmount.toFixed(2)}
                </p>
              </div>
            </button>
            <Button
              type="button"
              className="mt-2 w-full rounded-xl bg-[hsl(30,80%,50%)] text-white hover:bg-[hsl(30,80%,45%)] font-semibold"
              onClick={(event) => {
                event.stopPropagation();
                onReview();
              }}
            >
              Review
            </Button>
          </div>
        </div>
      )}

      <DrawerContent
        className={cn(
          "md:hidden flex flex-col max-h-[85dvh] h-[85dvh] rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]",
          className,
        )}
      >
        <div className="shrink-0 flex flex-col items-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex-1 min-h-0 overflow-auto border-t border-border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="font-semibold flex items-center gap-2">
              <ShoppingCart className="size-4 text-[hsl(30,80%,50%)]" />
              Current Order
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-destructive hover:underline"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
          <ul className="p-4 space-y-2">
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
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="size-7 rounded border border-border text-xs font-medium hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="size-7 rounded border border-border text-xs font-medium hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0 border-t border-border p-4 space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Total Amount</span>
            <span className="text-primary">P{totalAmount.toFixed(2)}</span>
          </div>
          <Button
            type="button"
            className="w-full rounded-xl bg-[hsl(30,80%,50%)] text-white hover:bg-[hsl(30,80%,45%)]"
            onClick={onReview}
          >
            Review
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
