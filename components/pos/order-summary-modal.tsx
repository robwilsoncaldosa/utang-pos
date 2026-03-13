"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartContext } from "./cart-provider";
import { ShoppingCart, Truck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  onProceedToPayment: () => void;
};

export function OrderSummaryModal({
  open,
  onClose,
  onProceedToPayment,
}: OrderSummaryModalProps) {
  const { items, updateQuantity, removeItem, subtotal, taxAmount, totalAmount } =
    useCartContext();
  const isEmpty = items.length === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showClose
        className={cn(
          "max-w-4xl max-h-[92vh] overflow-hidden flex flex-col",
          "lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-6"
        )}
      >
        <DialogHeader className="sr-only lg:not-sr-only lg:col-span-2">
          <DialogTitle>Order Summary</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-hidden min-h-0">
          <div className="flex items-center justify-between gap-2 font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-muted-foreground" />
              Itemized Order
            </div>
            <span className="text-xs text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex-1 overflow-auto space-y-3 pr-1">
            {items.map((item) => (
              <div
                key={item.productId}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div
                  aria-hidden
                  className="h-14 w-14 rounded-lg border border-border bg-muted bg-cover bg-center"
                  style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    P{item.price.toFixed(2)} each
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label={`Decrease quantity of ${item.name}`}
                      className="inline-flex h-10 min-w-10 items-center justify-center rounded-l-lg px-2 text-base hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="inline-flex min-w-10 items-center justify-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label={`Increase quantity of ${item.name}`}
                      className="inline-flex h-10 min-w-10 items-center justify-center rounded-r-lg px-2 text-base hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between gap-2">
                  <span className="font-semibold">
                    P{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-muted"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            {isEmpty && (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                Add products to continue checkout.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t pt-4 lg:border-l lg:pl-6 lg:border-t-0 lg:pt-0">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Truck className="size-4 text-muted-foreground" />
              Shipping Information
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Store Pickup</p>
              <p>Pickup at cashier after payment confirmation.</p>
              <p>Estimated ready time: 10-15 minutes</p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>P{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (12%)</span>
              <span>P{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="text-primary">P{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <Button
            size="lg"
            className="h-12 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => {
              onClose();
              onProceedToPayment();
            }}
            disabled={isEmpty}
          >
            Proceed to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
