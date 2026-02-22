"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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
  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card p-4 w-full md:w-48 lg:w-52",
        "flex flex-col",
        className
      )}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 shrink-0">
        CATEGORIES
      </h2>
      <nav className="flex flex-row gap-2 overflow-x-auto pb-1 md:overflow-visible md:flex-col">
        {categories.map((cat) => {
          const isSelected = selectedId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span>{cat.name}</span>
              {isSelected && <ChevronDown className="size-4 shrink-0" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
