"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductCardProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName: string;
  imageUrl?: string | null;
};

type ProductCardProps = {
  product: ProductCardProduct;
  onAddToCart: () => void;
  className?: string;
};

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow",
        className
      )}
    >
      <div className="relative aspect-square bg-muted/50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4">
            <ShoppingCart className="size-12 text-muted-foreground/50" />
          </div>
        )}
        <Badge
          variant="destructive"
          className="absolute top-2 right-2 text-[10px] font-semibold"
        >
          Stock: {product.stock}
        </Badge>
      </div>
      <CardContent className="p-3">
        <p className="font-semibold text-foreground line-clamp-2 leading-tight">
          {product.name}
        </p>
        <p className="mt-1 text-base font-semibold text-[hsl(30,80%,50%)]">
          P{product.price.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">{product.categoryName}</p>
        <Button
          type="button"
          size="sm"
          className="mt-2 w-full rounded-lg"
          onClick={onAddToCart}
          disabled={product.stock < 1}
        >
          Add to cart
        </Button>
      </CardContent>
    </Card>
  );
}
