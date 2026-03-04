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
} from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormState, useFormStatus } from "react-dom";
import { Lock } from "lucide-react";
import { updatePasswordAction, type UpdatePasswordActionState } from "@/lib/supabase/actions";

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className={authPrimaryButtonClass} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [formState, formAction] = useFormState<UpdatePasswordActionState, FormData>(
    updatePasswordAction,
    {
      error: null,
    }
  );

  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      <AuthCard>
        <AuthCardHeader
          title="Set New Password"
          description="Enter your new password below"
        />
        <AuthCardContent>
          <form action={formAction} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="password" className={authLabelClass}>
                New password
              </Label>
              <div className={authInputWrapperClass}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Lock className="size-4 text-muted-foreground" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="............"
                  required
                  className={authInputClass}
                />
              </div>
            </div>
            {formState.error && (
              <p className="text-xs font-medium text-destructive">{formState.error}</p>
            )}
            <SubmitButton idleLabel="Save new password" pendingLabel="Saving..." />
          </form>
        </AuthCardContent>
      </AuthCard>
    </div>
  );
}
