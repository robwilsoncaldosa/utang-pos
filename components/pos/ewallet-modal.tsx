"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type EwalletModalProps = {
  open: boolean;
  onClose: () => void;
  onBackToPayment: () => void;
  onConfirmPayment?: () => void;
  isSubmitting?: boolean;
};

const EWALLETS = [
  {
    id: "maya",
    name: "Maya",
    color: "bg-emerald-100 dark:bg-emerald-950",
    note: "Transfer fees may apply",
  },
  {
    id: "gcash",
    name: "GCash",
    color: "bg-blue-600 text-white",
    note: "Transfer fees may apply",
  },
  {
    id: "mcash",
    name: "MCash",
    color: "bg-card border border-border",
    note: "Use mobile number. QR code currently not working.",
  },
] as const;

export function EwalletModal({
  open,
  onClose,
  onBackToPayment,
  onConfirmPayment,
  isSubmitting = false,
}: EwalletModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showClose
        className="max-w-2xl max-h-[90vh] overflow-auto"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-[hsl(30,80%,50%)]" />
            <DialogTitle className="text-base font-normal text-muted-foreground">
              You may pay via e-wallet by scanning the QR code.
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {EWALLETS.map((w) => (
            <Card
              key={w.id}
              className={cn(
                "overflow-hidden",
                w.id === "gcash" && "text-white border-0",
                w.id === "maya" && w.color,
                w.id === "gcash" && w.color,
                w.id === "mcash" && "bg-card"
              )}
            >
              <CardContent className="p-4 flex flex-col items-center gap-3 min-h-[200px]">
                <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center text-2xl font-bold text-foreground">
                  {w.name.slice(0, 1)}
                </div>
                <p className="text-sm font-medium">{w.name}</p>
                <div className="w-24 h-24 rounded bg-white/80 flex items-center justify-center text-[10px] text-muted-foreground">
                  QR
                </div>
                <p className="text-xs opacity-80">{w.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-destructive pt-2">
          Note: The MCash QR code is currently not working. Please use the
          number instead. Thank you!
        </p>

        <div className="flex flex-col gap-2 pt-2">
          {onConfirmPayment && (
            <Button
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
              onClick={() => {
                onClose();
                onConfirmPayment();
              }}
            >
              {isSubmitting ? "Processing payment..." : "I&apos;ve paid via e-wallet"}
            </Button>
          )}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              onClose();
              onBackToPayment();
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Go back to Payment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
