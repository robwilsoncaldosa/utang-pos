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
import { signUpAction, type SignUpActionState } from "@/lib/supabase/actions";

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={authPrimaryButtonClass} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formState, formAction] = useFormState<SignUpActionState, FormData>(signUpAction, {
    error: null,
  });

  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      <AuthCard>
        <AuthCardHeader
          title="Register Store"
          description="Create your store account to get started"
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
              <Label htmlFor="password" className={authLabelClass}>
                Password
              </Label>
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
            <div className="grid gap-2">
              <Label htmlFor="repeat-password" className={authLabelClass}>
                Repeat password
              </Label>
              <div className={authInputWrapperClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Lock className="size-4 text-muted-foreground" />
                </div>
                <Input
                  id="repeat-password"
                  name="repeatPassword"
                  type="password"
                  required
                  placeholder="............"
                  className={authInputClass}
                />
              </div>
            </div>
            {formState.error && (
              <p className="text-xs font-medium text-destructive">{formState.error}</p>
            )}
            <SubmitButton idleLabel="Register" pendingLabel="Creating account..." />
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className={authLinkClass}>
                Sign In
              </Link>
            </p>
          </form>
        </AuthCardContent>
      </AuthCard>
    </div>
  );
}
