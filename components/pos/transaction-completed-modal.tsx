"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Share2 } from "lucide-react";
import { useCartContext } from "./cart-provider";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

type TransactionCompletedModalProps = {
  open: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
  paymentMethod?: "Credit" | "Cash" | "E-wallets";
  orderNumber?: string;
};

export function TransactionCompletedModal({
  open,
  onClose,
  onNewTransaction,
  paymentMethod = "Cash",
  orderNumber = "00001",
}: TransactionCompletedModalProps) {
  const { items, totalAmount } = useCartContext();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showClose={false}
        className="max-w-md max-h-[90vh] overflow-auto p-0 gap-0"
      >
        <DialogTitle className="sr-only">Transaction Completed</DialogTitle>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-t-lg p-6 text-center">
          <CheckCircle2 className="size-16 text-emerald-600 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-foreground">
            Transaction Completed
          </h2>
          <p className="text-sm text-muted-foreground">Order #{orderNumber}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="font-semibold">UTang POS</p>
            <p className="text-xs text-muted-foreground">
              Technology Group, Cebu, Philippines
            </p>
            <p className="text-xs text-muted-foreground">09617590889</p>
          </div>

          <div className="text-sm space-y-1 border-y border-border py-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>Walk-in Customer</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="text-emerald-600 font-medium">{paymentMethod}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground border-b border-border pb-1">
              <span>ITEM</span>
              <span className="text-center">QTY</span>
              <span className="text-right">TOTAL</span>
            </div>
            {items.map((item) => (
              <div
                key={item.productId}
                className="grid grid-cols-3 text-sm"
              >
                <span className="truncate">{item.name}</span>
                <span className="text-center">{item.quantity}</span>
                <span className="text-right">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1 pt-2 border-t border-border text-sm">
            <div className="flex justify-between font-bold text-primary text-base pt-1">
              <span>Total</span>
              <span>₱{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => { }}
            >
              <Download className="size-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => { }}
            >
              <Share2 className="size-4 mr-2" />
              Share
            </Button>
          </div>

          <Button
            className="w-full rounded-xl bg-primary text-primary-foreground mt-4"
            onClick={() => {
              onClose();
              onNewTransaction();
            }}
          >
            New Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
