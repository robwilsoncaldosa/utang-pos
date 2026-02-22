"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
import { useState } from "react";
import { Mail } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      <AuthCard>
        {success ? (
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
              <form
                onSubmit={handleForgotPassword}
                className="flex flex-col gap-6"
              >
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
                      type="email"
                      placeholder="admin@utang.ph"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={authInputClass}
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-xs font-medium text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className={authPrimaryButtonClass}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send reset email"}
                </Button>
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
