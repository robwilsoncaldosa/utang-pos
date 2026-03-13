import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_TABLE_CONFIGS, type AdminTableName } from "@/lib/admin/entity-config";
import { getTableSchema } from "@/lib/admin/schemas";
import {
  createTableRow,
  deleteTableRow,
  getTableRows,
  getTableOptions,
  type TableOption,
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

function resolveDisplayValue(
  rawValue: unknown,
  options: TableOption[] | undefined,
  staticOptions: Array<{ label: string; value: string }> | undefined
) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "";
  }
  const value = String(rawValue);
  if (options?.length) {
    const match = options.find((option) => option.value === value);
    if (match) {
      return match.label;
    }
  }
  if (staticOptions?.length) {
    const match = staticOptions.find((option) => option.value === value);
    if (match) {
      return match.label;
    }
  }
  if (typeof rawValue === "string" && /^\d{4}-\d{2}-\d{2}T/.test(rawValue)) {
    const parsed = new Date(rawValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
  }
  return stringifyValue(rawValue);
}

export default async function AdminEntityPage({
  params,
  searchParams,
}: {
  params: Promise<{ table: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { table } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const viewParam = resolvedSearchParams.view;
  const currentView = (Array.isArray(viewParam) ? viewParam[0] : viewParam) === "edit" ? "edit" : "create";
  if (!isAdminTableName(table)) {
    notFound();
  }
  const tableName: AdminTableName = table;

  const config = ADMIN_TABLE_CONFIGS[tableName];
  const rows = await getTableRows(tableName);

  const relationOptions: Record<string, TableOption[]> = {};

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
  const fieldByName = Object.fromEntries(config.fields.map((field) => [field.name, field]));

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

      <div className="w-full overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-lg border bg-muted/20 p-1 sm:min-w-0">
          <Link
            href={`/admin/${tableName}?view=create`}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${currentView === "create"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Create
          </Link>
          <Link
            href={`/admin/${tableName}?view=edit`}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${currentView === "edit"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Edit
          </Link>
        </div>
      </div>

      {currentView === "create" ? (
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
              tableName={tableName}
              uploads={config.uploads}
            />
          </CardContent>
        </Card>
      ) : (
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
            const displayFieldConfig = fieldByName[config.displayField];
            const displayLabel = resolveDisplayValue(
              row[config.displayField],
              relationOptions[config.displayField],
              displayFieldConfig?.options
            );
            return (
              <Card key={rowId || `${config.keyField}-${index}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {displayLabel || `${toSingularLabel(config.label)} record`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DynamicForm
                    fields={config.fields}
                    action={updateAction}
                    defaultValues={{ ...row, id: rowId }}
                    options={relationOptions}
                    submitLabel="Save Changes"
                    tableName={tableName}
                    uploads={config.uploads}
                  />

                  <DeleteRecord action={deleteAction} rowId={rowId} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
