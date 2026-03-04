import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/supabase/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit">Logout</Button>
    </form>
  );
}
