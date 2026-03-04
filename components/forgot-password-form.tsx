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
import { Mail } from "lucide-react";
import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/lib/supabase/actions";

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={authPrimaryButtonClass} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formState, formAction] = useFormState<ForgotPasswordActionState, FormData>(
    forgotPasswordAction,
    {
      error: null,
      success: false,
    }
  );

  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      <AuthCard>
        {formState.success ? (
          <>
            <AuthCardHeader
              title="Check Your Email"
              description="Password reset instructions sent"
            />
            <AuthCardContent>
              <p className="text-center text-sm text-muted-foreground">
                If you registered with this email, you will receive a password
                reset link shortly.
              </p>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                <Link href="/auth/login" className={authLinkClass}>
                  Back to Sign In
                </Link>
              </p>
            </AuthCardContent>
          </>
        ) : (
          <>
            <AuthCardHeader
              title="Reset Password"
              description="Enter your email and we'll send you a reset link"
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
                {formState.error && (
                  <p className="text-xs font-medium text-destructive">
                    {formState.error}
                  </p>
                )}
                <SubmitButton idleLabel="Send reset email" pendingLabel="Sending..." />
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className={authLinkClass}>
                    Sign In
                  </Link>
                </p>
              </form>
            </AuthCardContent>
          </>
        )}
      </AuthCard>
    </div>
  );
}
