"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCartContext } from "./cart-provider";
import { ShoppingCart, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderSummaryModalProps = {
  open: boolean;
  onClose: () => void;
  onProceedToPayment: () => void;
};

const CUSTOMER_OPTIONS = ["Walk-in Customer", "Shobi Umaran"] as const;

export function OrderSummaryModal({
  open,
  onClose,
  onProceedToPayment,
}: OrderSummaryModalProps) {
  const { items, updateQuantity,totalAmount } =
    useCartContext();
  const isEmpty = items.length === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showClose
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-hidden flex flex-col",
          "md:grid md:grid-cols-2 md:gap-6"
        )}
      >
        <DialogHeader className="sr-only md:not-sr-only md:col-span-2">
          <DialogTitle>Order Summary</DialogTitle>
        </DialogHeader>

        {/* Your Items */}
        <div className="flex flex-col gap-3 overflow-hidden min-h-0">
          <div className="flex items-center gap-2 font-semibold shrink-0">
            <ShoppingCart className="size-5 text-muted-foreground" />
            Your Items
          </div>
          <div className="flex-1 overflow-auto space-y-2 pr-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × P{item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="size-8 rounded-full border border-border text-sm hover:bg-muted"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="size-8 rounded-full border border-border text-sm hover:bg-muted"
                  >
                    +
                  </button>
                </div>
                <span className="font-medium shrink-0 w-16 text-right">
                  P{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="flex flex-col gap-3 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
          <div className="flex items-center gap-2 font-semibold shrink-0">
            <PlusCircle className="size-5 text-muted-foreground" />
            Transaction Details
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="order-customer" className="text-muted-foreground">
                Customer Selection
              </Label>
              <select
                id="order-customer"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {CUSTOMER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-notes" className="text-muted-foreground">
                Internal Notes
              </Label>
              <textarea
                id="order-notes"
                placeholder="Write transaction notes or references..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer: Total + Proceed */}
        <div className="col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Amount Payable
            </p>
            <p className="text-2xl font-bold text-primary">
              P{totalAmount.toFixed(2)}
            </p>
          </div>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0"
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
