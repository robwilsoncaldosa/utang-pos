"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import { useCartContext } from "./cart-provider";
import { cn } from "@/lib/utils";

type PaymentOptionsModalProps = {
  open: boolean;
  onClose: () => void;
  onBackToReview: () => void;
  onSelectCredit: () => void;
  onSelectCash: () => void;
  onSelectEwallet: () => void;
  isSubmitting?: boolean;
};

export function PaymentOptionsModal({
  open,
  onClose,
  onBackToReview,
  onSelectCredit,
  onSelectCash,
  onSelectEwallet,
  isSubmitting = false,
}: PaymentOptionsModalProps) {
  const { totalAmount } = useCartContext();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showClose
        className="max-w-md max-h-[90vh] overflow-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-left">Amount Payable</DialogTitle>
          <p className="text-2xl font-bold text-foreground pt-1">
            ₱{totalAmount.toFixed(2)}
          </p>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">Choose payment option</p>

        <div className="grid gap-3 pt-2">
          <Button
            type="button"
            className="h-14 justify-start gap-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
            onClick={() => {
              onClose();
              onSelectCredit();
            }}
          >
            <CreditCard className="size-6" />
            <div className="text-left">
              <span className="block font-semibold">Credit</span>
              <span className="block text-xs opacity-90">UTANG</span>
            </div>
          </Button>
          <Button
            type="button"
            className="h-14 justify-start gap-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={isSubmitting}
            onClick={() => {
              onClose();
              onSelectCash();
            }}
          >
            <Banknote className="size-6" />
            <span className="font-semibold">Cash</span>
          </Button>
          <Button
            type="button"
            className="h-14 justify-start gap-4 rounded-xl bg-[hsl(30,80%,50%)] text-white hover:bg-[hsl(30,80%,45%)]"
            disabled={isSubmitting}
            onClick={() => {
              onClose();
              onSelectEwallet();
            }}
          >
            <Smartphone className="size-6" />
            <span className="font-semibold">E-wallets</span>
          </Button>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            onClose();
            onBackToReview();
          }}
          className="text-sm text-muted-foreground hover:text-foreground underline pt-2"
        >
          Go back to Review
        </button>
      </DialogContent>
    </Dialog>
  );
}
