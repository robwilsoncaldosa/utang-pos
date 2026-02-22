"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { ProductCard, type ProductCardProduct } from "./product-card";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/lib/constants";
import { useCartContext } from "./cart-provider";
import { cn } from "@/lib/utils";

type ProductGridProps = {
  categoryId: string;
  searchQuery: string;
  className?: string;
};

function getCategoryName(id: string): string {
  const cat = MOCK_CATEGORIES.find((c) => c.id === id);
  return cat?.name ?? "Uncategorized";
}

export function ProductGrid({
  categoryId,
  searchQuery,
  className,
}: ProductGridProps) {
  const { addItem } = useCartContext();

  const products = useMemo(() => {
    let list = [...MOCK_PRODUCTS];
    if (categoryId !== "all") {
      list = list.filter((p) => p.categoryId === categoryId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoryId, searchQuery]);

  const productCards: ProductCardProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    categoryName: getCategoryName(p.categoryId),
    imageUrl: p.imageUrl,
  }));

  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-auto p-4 md:p-6",
        className
      )}
    >
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {productCards.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => {
              addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
              });
              toast.success("Added to cart", {
                description: `${product.name} · P${product.price.toFixed(2)}`,
              });
            }}
          />
        ))}
      </div>
      {productCards.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No products match your search or category.
        </p>
      )}
    </div>
  );
}
