import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_TABLE_CONFIGS, type AdminTableName } from "@/lib/admin/entity-config";
import { getTableSchema } from "@/lib/admin/schemas";
import {
  createTableRow,
  deleteTableRow,
  getTableRows,
  getTableOptions,
  updateTableRow,
} from "@/server/admin/data";
import { DynamicForm, type FormState } from "@/components/admin/dynamic-form";
import { DeleteRecord } from "@/components/admin/delete-record";

function isAdminTableName(value: string): value is AdminTableName {
  return value in ADMIN_TABLE_CONFIGS;
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function getRowId(row: Record<string, unknown>, keyField: string) {
  const raw = row[keyField];
  return raw ? String(raw) : "";
}

function toSingularLabel(label: string) {
  if (label.endsWith("ies")) {
    return `${label.slice(0, -3)}y`;
  }
  if (label.endsWith("s")) {
    return label.slice(0, -1);
  }
  return label;
}

export default async function AdminEntityPage({
  params,
}: {
  params: Promise<{ table: string }>;
}) {
  const { table } = await params;
  if (!isAdminTableName(table)) {
    notFound();
  }
  const tableName: AdminTableName = table;

  const config = ADMIN_TABLE_CONFIGS[tableName];
  const rows = await getTableRows(tableName);

  const relationOptions: Record<string, Array<{ label: string; value: string }>> = {};

  for (const field of config.fields) {
    if (field.relation) {
      const options = await getTableOptions(
        field.relation.table,
        field.relation.labelField,
        field.relation.valueField
      );
      relationOptions[field.name] = options;
    }
  }

  async function createAction(prevState: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const schema = getTableSchema(tableName);
    const data = Object.fromEntries(formData);
    const validation = schema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    try {
      await createTableRow(tableName, formData);
      revalidatePath(`/admin/${tableName}`);
      revalidatePath("/admin");
      return { success: true, message: "Record created successfully" };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  async function updateAction(prevState: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const rowId = String(formData.get("rowId") ?? "");
    const schema = getTableSchema(tableName);
    const data = Object.fromEntries(formData);
    const validation = schema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    try {
      await updateTableRow(tableName, rowId, formData);
      revalidatePath(`/admin/${tableName}`);
      revalidatePath("/admin");
      return { success: true, message: "Record updated successfully" };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  async function deleteAction(prevState: FormState, formData: FormData): Promise<FormState> {
    "use server";
    const rowId = String(formData.get("rowId") ?? "");
    try {
      await deleteTableRow(tableName, rowId);
      revalidatePath(`/admin/${tableName}`);
      revalidatePath("/admin");
      return { success: true, message: "Record deleted successfully" };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold">{config.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create {toSingularLabel(config.label)}</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicForm
            fields={config.fields}
            action={createAction}
            options={relationOptions}
            submitLabel="Create"
            isCreate
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No records found.
            </CardContent>
          </Card>
        ) : null}
        {rows.map((row, index) => {
          const rowId = getRowId(row, config.keyField);
          return (
            <Card key={rowId || `${config.keyField}-${index}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {config.keyField}: {rowId || "N/A"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {config.columns.map((column) => (
                    <div key={column.key} className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">{column.label}</p>
                      <p className="mt-1 line-clamp-4 text-sm whitespace-pre-wrap">
                        {stringifyValue(row[column.key]) || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <details className="rounded-md border p-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Edit record
                  </summary>
                  <div className="mt-4">
                    <DynamicForm
                      fields={config.fields}
                      action={updateAction}
                      defaultValues={{ ...row, id: rowId }}
                      options={relationOptions}
                      submitLabel="Save changes"
                    />
                  </div>
                </details>

                <DeleteRecord action={deleteAction} rowId={rowId} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
