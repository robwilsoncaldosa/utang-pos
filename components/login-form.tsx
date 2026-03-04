"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AuthCard,
  AuthCardContent,
  AuthCardHeader,
  authInputClass,
  authInputWrapperClass,
  authLabelClass,
  authPrimaryButtonClass,
  authLinkClass,
} from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Lock, Mail } from "lucide-react";
import { loginAction, type LoginActionState } from "@/lib/supabase/actions";

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={authPrimaryButtonClass} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formState, formAction] = useFormState<LoginActionState, FormData>(loginAction, {
    error: null,
  });

  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      <AuthCard>
        <AuthCardHeader
          title="Welcome Back"
          description="Digitalize your store credit with UTang"
        />
        <AuthCardContent>
          <form action={formAction} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className={authLabelClass}>
                Email address
              </Label>
              <div className={authInputWrapperClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Mail className="size-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@utang.ph"
                  required
                  className={authInputClass}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className={authLabelClass}>
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className={authInputWrapperClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Lock className="size-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={authInputClass}
                />
              </div>
            </div>
            {formState.error && (
              <p className="text-xs font-medium text-destructive">{formState.error}</p>
            )}
            <SubmitButton idleLabel="Sign In" pendingLabel="Signing in..." />
            <p className="text-center text-xs text-muted-foreground">
              New manager?{" "}
              <Link href="/auth/sign-up" className={authLinkClass}>
                Register Store
              </Link>
            </p>
          </form>
        </AuthCardContent>
      </AuthCard>
    </div>
  );
}
