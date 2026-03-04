import { createClient } from "@/lib/supabase/server";

type AuditLogInput = {
  userId: string | null;
  tableName: string;
  action: string;
  recordId?: string | null;
  payload?: Record<string, unknown> | null;
};

export async function logAudit(input: AuditLogInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert({
    user_id: input.userId,
    table_name: input.tableName,
    action: input.action,
    record_id: input.recordId ?? null,
    payload: input.payload ?? null,
  });
  if (error) {
    console.error(error);
  }
}
