"use client";

import { useState, useCallback } from "react";
import { PosHeader } from "./pos-header";
import { CategoryList } from "./category-list";
import { ProductGrid } from "./product-grid";
import { CartSidebar } from "./cart-sidebar";
import { CartBottomSheet } from "./cart-bottom-sheet";
import { OrderSummaryModal } from "./order-summary-modal";
import { PaymentOptionsModal } from "./payment-options-modal";
import { EwalletModal } from "./ewallet-modal";
import { TransactionCompletedModal } from "./transaction-completed-modal";
import { CartProvider, useCartContext } from "./cart-provider";
import { MOCK_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function PosDashboardInner() {
  const [categoryId, setCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [ewalletOpen, setEwalletOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<
    "Credit" | "Cash" | "E-wallets"
  >("Cash");
  const [mobileCartExpanded, setMobileCartExpanded] = useState(false);

  const { itemCount, clearCart } = useCartContext();
  const categories = MOCK_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));

  const handleProceedToPayment = useCallback(() => {
    setOrderSummaryOpen(false);
    setPaymentOpen(true);
  }, []);

  const handleBackToReview = useCallback(() => {
    setPaymentOpen(false);
    setEwalletOpen(false);
    setOrderSummaryOpen(true);
  }, []);

  const handleSelectCredit = useCallback(() => {
    setPaymentOpen(false);
    setCompletedPaymentMethod("Credit");
    setCompletedOpen(true);
  }, []);

  const handleSelectCash = useCallback(() => {
    setPaymentOpen(false);
    setCompletedPaymentMethod("Cash");
    setCompletedOpen(true);
  }, []);

  const handleSelectEwallet = useCallback(() => {
    setPaymentOpen(false);
    setEwalletOpen(true);
  }, []);

  const handleBackToPayment = useCallback(() => {
    setEwalletOpen(false);
    setPaymentOpen(true);
  }, []);

  const handleConfirmEwallet = useCallback(() => {
    setEwalletOpen(false);
    setCompletedPaymentMethod("E-wallets");
    setCompletedOpen(true);
  }, []);

  const handleNewTransaction = useCallback(() => {
    setCompletedOpen(false);
    setOrderSummaryOpen(false);
    setPaymentOpen(false);
    setEwalletOpen(false);
    clearCart();
  }, [clearCart]);

  const handleReview = useCallback(() => {
    setOrderSummaryOpen(true);
  }, []);

  return (
    <div className="flex h-dvh flex-col md:h-screen overflow-hidden">
      <PosHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartClick={() => setMobileCartExpanded(true)}
        cartItemCount={itemCount}
      />

      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block">
          <CategoryList
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            className="shrink-0 border-r border-border bg-card md:w-48 lg:w-52 border-b md:border-b-0 flex flex-row md:flex-col flex-wrap md:flex-nowrap"
          />
        </div>

        <main
          className={cn(
            "flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden",
            itemCount > 0 && "pb-44 md:pb-0"
          )}
        >
          <ProductGrid
            categoryId={categoryId}
            searchQuery={searchQuery}
          />
        </main>

        <div className="hidden md:flex flex-col w-80 lg:w-96 shrink-0 border-l border-border min-h-0">
          <CartSidebar onReview={handleReview} />
        </div>
      </div>

      <CartBottomSheet
        onReview={handleReview}
        expanded={mobileCartExpanded}
        onExpandedChange={setMobileCartExpanded}
      />

      <OrderSummaryModal
        open={orderSummaryOpen}
        onClose={() => setOrderSummaryOpen(false)}
        onProceedToPayment={handleProceedToPayment}
      />
      <PaymentOptionsModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onBackToReview={handleBackToReview}
        onSelectCredit={handleSelectCredit}
        onSelectCash={handleSelectCash}
        onSelectEwallet={handleSelectEwallet}
      />
      <EwalletModal
        open={ewalletOpen}
        onClose={() => setEwalletOpen(false)}
        onBackToPayment={handleBackToPayment}
        onConfirmPayment={handleConfirmEwallet}
      />
      <TransactionCompletedModal
        open={completedOpen}
        onClose={() => setCompletedOpen(false)}
        onNewTransaction={handleNewTransaction}
        paymentMethod={completedPaymentMethod}
      />
    </div>
  );
}

export function PosDashboard() {
  return (
    <CartProvider>
      <PosDashboardInner />
    </CartProvider>
  );
}
