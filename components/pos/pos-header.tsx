"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

type PosHeaderProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCartClick?: () => void;
  cartItemCount?: number;
  className?: string;
};

export function PosHeader({
  searchQuery,
  onSearchChange,
  onCartClick,
  cartItemCount = 0,
  className,
}: PosHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4 md:px-6",
        className
      )}
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-primary font-semibold"
      >
        <span className="relative flex h-9 w-9 items-center justify-center">
          <Image
            src="/logo.svg"
            alt="UTang POS"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </span>
        <span className="hidden sm:inline">UTang POS</span>
      </Link>

      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search products by name or barcode..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-muted/80 pl-9 pr-4 border-0 focus-visible:ring-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeSwitcher />
        {onCartClick != null && (
        <button
          type="button"
          onClick={onCartClick}
          className="md:hidden flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary relative"
          aria-label="Open cart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartItemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </button>
        )}
      </div>
    </header>
  );
}
