import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/supabase/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user } = await fetchUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
