import { z } from "zod";
import { ADMIN_TABLE_CONFIGS, type AdminTableName } from "./entity-config";

export function getTableSchema(table: AdminTableName) {
  const config = ADMIN_TABLE_CONFIGS[table];
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of config.fields) {
    let schema: z.ZodTypeAny = z.string();

    if (field.type === "number") {
      schema = z.coerce.number();
    } else if (field.type === "json") {
      schema = z.string().transform((str, ctx) => {
        if (!str) return null;
        try {
          return JSON.parse(str);
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
          return z.NEVER;
        }
      });
    }

    if (field.nullable) {
      if (field.type === "number") {
        schema = z.union([
          z.number(),
          z.string().length(0).transform(() => null),
          z.null(),
          z.undefined()
        ]);
      } else if (field.type === "json") {
        schema = schema.nullable().optional();
      } else {
        schema = schema.nullable().optional().or(z.literal(""));
      }
    } else {
      if (field.type === "text" || field.type === "select") {
        schema = (schema as z.ZodString).min(1, "Required");
      }
    }
    shape[field.name] = schema;
  }

  return z.object(shape);
}
