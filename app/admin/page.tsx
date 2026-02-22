import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
        <Link href="/admin" className="font-semibold text-foreground">
          UTang POS
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to your store admin. This area is only available when signed
          in.
        </p>
      </main>
    </div>
  );
}
