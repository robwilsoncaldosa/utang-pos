"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

type CategoryListProps = {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function CategoryList({
  categories,
  selectedId,
  onSelect,
  className,
}: CategoryListProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const total = categories.length;
      if (total === 0) return;
      let nextIndex: number | null = null;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % total;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + total) % total;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = total - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      const nextCategory = categories[nextIndex];
      if (nextCategory) {
        onSelect(nextCategory.id);
        requestAnimationFrame(() => {
          buttonRefs.current[nextIndex]?.focus();
        });
      }
    },
    [categories, onSelect],
  );

  return (
    <section
      className={cn(
        "w-full flex flex-col gap-2",
        className,
      )}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Categories
      </h2>
      <div
        role="listbox"
        aria-label="Product categories"
        className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible"
      >
        {categories.map((cat, index) => {
          const isSelected = selectedId === cat.id;
          return (
            <button
              key={cat.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={`Select category ${cat.name}`}
              onClick={() => onSelect(cat.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "inline-flex items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "h-11 min-h-[44px] shrink-0",
                isSelected
                  ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                  : "bg-card text-foreground border-border hover:bg-muted active:bg-muted/80",
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
