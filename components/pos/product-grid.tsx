"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { ProductCard, type ProductCardProduct } from "./product-card";
import { useCartContext } from "./cart-provider";
import { cn } from "@/lib/utils";
import type { Tables } from "@/database.types";

type CategoryRow = Tables<"categories">;
type ProductRow = Tables<"products">;

type ProductGridProps = {
  categoryId: string;
  searchQuery: string;
  products: ProductRow[];
  categories: CategoryRow[];
  className?: string;
};

export function ProductGrid({
  categoryId,
  searchQuery,
  products,
  categories,
  className,
}: ProductGridProps) {
  const { addItem } = useCartContext();

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (categoryId !== "all") {
      list = list.filter((product) => product.category_id === categoryId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoryId, products, searchQuery]);

  const productCards: ProductCardProduct[] = filteredProducts.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock_quantity,
    categoryName:
      categoryNameById.get(product.category_id ?? "") ?? "Uncategorized",
    imageUrl: product.image_url,
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
