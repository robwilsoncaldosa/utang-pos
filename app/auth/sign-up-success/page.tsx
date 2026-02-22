import {
  AuthCard,
  AuthCardContent,
  AuthCardHeader,
  authLinkClass,
} from "@/components/auth-card";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <AuthCard>
        <AuthCardHeader
          title="Thank you for signing up!"
          description="Check your email to confirm your account"
        />
        <AuthCardContent>
          <p className="text-center text-sm text-muted-foreground">
            You&apos;ve successfully signed up. Please check your email to
            confirm your account before signing in.
          </p>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/auth/login" className={authLinkClass}>
              Back to Sign In
            </Link>
          </p>
        </AuthCardContent>
      </AuthCard>
    </div>
  );
}
