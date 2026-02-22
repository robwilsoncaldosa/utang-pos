import {
  AuthCard,
  AuthCardContent,
  AuthCardHeader,
  authLinkClass,
} from "@/components/auth-card";
import Link from "next/link";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">Code error: {params.error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <AuthCard>
        <AuthCardHeader
          title="Something went wrong"
          description="We couldn’t complete your request."
          showLogo={true}
        />
        <AuthCardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
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
