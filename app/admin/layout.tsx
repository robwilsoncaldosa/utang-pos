import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUserRole } from "@/lib/admin/roles";
import { fetchUser } from "@/lib/supabase/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = await fetchUser();
  const { role } = await getCurrentUserRole();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="h-svh overflow-hidden [--header-height:calc(--spacing(14))]">
      <SidebarProvider className="h-full flex flex-col overflow-hidden">
        <SiteHeader userEmail={user.email ?? "unknown"} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AppSidebar
            user={{
              name: user.email?.split("@")[0] ?? "Admin",
              email: user.email ?? "unknown",
              avatar: "",
            }}
            role={role ?? "editor"}
          />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
