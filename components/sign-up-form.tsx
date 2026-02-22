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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail } from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/admin`,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      <AuthCard>
        <AuthCardHeader
          title="Register Store"
          description="Create your store account to get started"
        />
        <AuthCardContent>
          <form onSubmit={handleSignUp} className="flex flex-col gap-6">
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  type="password"
                  required
                  placeholder="............"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className={authInputClass}
                />
              </div>
            </div>
            {error && (
              <p className="text-xs font-medium text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className={authPrimaryButtonClass}
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Register"}
            </Button>
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
