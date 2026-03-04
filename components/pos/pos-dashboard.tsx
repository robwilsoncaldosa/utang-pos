"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import type { Tables } from "@/database.types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CategoryRow = Tables<"categories">;
type ProductRow = Tables<"products">;

type PosDashboardInnerProps = {
  categories: CategoryRow[];
  products: ProductRow[];
  categoriesError?: string | null;
  productsError?: string | null;
};

function PosDashboardInner({
  categories,
  products,
  categoriesError,
  productsError,
}: PosDashboardInnerProps) {
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
  const router = useRouter();

  const categoryOptions = useMemo(
    () => [{ id: "all", name: "All" }, ...categories.map((c) => ({ id: c.id, name: c.name }))],
    [categories]
  );

  useEffect(() => {
    if (categoryId !== "all" && !categories.some((category) => category.id === categoryId)) {
      setCategoryId("all");
    }
  }, [categories, categoryId]);

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

  const handleRetry = useCallback(() => {
    router.refresh();
  }, [router]);

  const renderErrorBanner = (message: string, onRetry: () => void) => (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <span>{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );

  const renderEmptyState = (messageLabel: string, buttonLabel: string, href: string) => (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        No {messageLabel} yet – add your first one.
      </p>
      <Button asChild size="lg">
        <Link href={href}>{buttonLabel}</Link>
      </Button>
    </div>
  );

  return (
    <div className="flex h-dvh flex-col md:h-screen overflow-hidden">
      <PosHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartClick={() => setMobileCartExpanded(true)}
        cartItemCount={itemCount}
      />

      <div className="flex flex-1 min-h-0">
        <main
          className={cn(
            "flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden",
            itemCount > 0 && "pb-44 md:pb-0"
          )}
        >
          {categoriesError ? (
            <section className="px-4 pt-4 md:px-6 md:pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </h2>
              {renderErrorBanner(categoriesError, handleRetry)}
            </section>
          ) : categories.length === 0 ? (
            <section className="px-4 pt-4 md:px-6 md:pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </h2>
              {renderEmptyState("categories", "Add Category", "/admin?view=categories")}
            </section>
          ) : (
            <CategoryList
              categories={categoryOptions}
              selectedId={categoryId}
              onSelect={setCategoryId}
              className="px-4 pt-4 md:px-6 md:pt-6"
            />
          )}

          {productsError ? (
            <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
              {renderErrorBanner(productsError, handleRetry)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
              {renderEmptyState("products", "Add Product", "/admin?view=products")}
            </div>
          ) : (
            <ProductGrid
              categoryId={categoryId}
              searchQuery={searchQuery}
              products={products}
              categories={categories}
            />
          )}
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

type PosDashboardProps = {
  categories: CategoryRow[];
  products: ProductRow[];
  categoriesError?: string | null;
  productsError?: string | null;
};

export function PosDashboard({
  categories,
  products,
  categoriesError,
  productsError,
}: PosDashboardProps) {
  return (
    <CartProvider>
      <PosDashboardInner
        categories={categories}
        products={products}
        categoriesError={categoriesError}
        productsError={productsError}
      />
    </CartProvider>
  );
}
