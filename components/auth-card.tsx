"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { cn } from "@/lib/utils";

const authCardClass =
  "flex min-h-svh flex-1 flex-col rounded-none border-0 bg-card shadow-none md:min-h-0 md:flex-initial md:rounded-[2rem] md:px-10 md:py-10 md:shadow-[0_18px_45px_rgba(15,35,70,0.18)]";

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Card className={cn(authCardClass, className)}>{children}</Card>;
}

export function AuthCardHeader({
  title,
  description,
  showLogo = true,
}: {
  title: string;
  description?: string;
  showLogo?: boolean;
}) {
  return (
    <CardHeader className="space-y-6 p-6 pt-8 md:p-0 md:pb-0">
      <div className="flex flex-col items-center space-y-4">
        {showLogo && (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <Image
              src="/logo.svg"
              alt="UTang POS"
              width={56}
              height={56}
              className="h-11 w-auto"
            />
          </div>
        )}
        <div className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
  );
}

export function AuthCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardContent className={cn("mt-8 space-y-6 p-6 pt-0 md:p-0", className)}>
      {children}
    </CardContent>
  );
}

export const authInputWrapperClass =
  "flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-2 shadow-sm";
export const authLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";
export const authInputClass =
  "border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0";
export const authPrimaryButtonClass =
  "mt-1 h-11 w-full rounded-xl bg-primary text-base font-semibold shadow-md hover:bg-primary/90";
export const authLinkClass =
  "font-semibold text-primary underline-offset-4 hover:underline";
