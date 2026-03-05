"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import type { AdminFieldConfig } from "@/lib/admin/entity-config";

export type FormState = {
    message?: string;
    errors?: Record<string, string[]>;
    success?: boolean;
};

type DynamicFormProps = {
    fields: AdminFieldConfig[];
    action: (state: FormState, payload: FormData) => Promise<FormState>;
    defaultValues?: Record<string, unknown>;
    options?: Record<string, Array<{ label: string; value: string }>>;
    submitLabel?: string;
    isCreate?: boolean;
};

export function DynamicForm({
    fields,
    action,
    defaultValues = {},
    options = {},
    submitLabel = "Save",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isCreate = false,
}: DynamicFormProps) {
    const [state, formAction, isPending] = useActionState(action, { message: "" });

    useEffect(() => {
        if (state.success && state.message) {
            toast.success(state.message);
        } else if (state.message && !state.success) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
            {!!defaultValues.id && <input type="hidden" name="rowId" value={String(defaultValues.id)} />}

            {fields.map((field) => {
                const fieldError = state.errors?.[field.name];
                // For updates, use defaultValue. For create, it's undefined usually.
                const defaultValue = defaultValues[field.name];
                const fieldOptions = field.relation
                    ? options[field.name] || []
                    : field.options || [];

                return (
                    <div key={field.name} className={field.type === "json" ? "md:col-span-2" : ""}>
                        <div className="grid gap-2">
                            <Label htmlFor={field.name} className={fieldError ? "text-destructive" : ""}>
                                {field.label}
                            </Label>

                            {field.type === "select" ? (
                                <div className="relative">
                                    <select
                                        id={field.name}
                                        name={field.name}
                                        defaultValue={String(defaultValue ?? "")}
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        {field.nullable ? <option value="">None</option> : null}
                                        {fieldOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : field.type === "json" ? (
                                <Textarea
                                    id={field.name}
                                    name={field.name}
                                    defaultValue={
                                        typeof defaultValue === "object"
                                            ? JSON.stringify(defaultValue, null, 2)
                                            : String(defaultValue ?? "")
                                    }
                                    placeholder={field.nullable ? "Optional JSON object" : "JSON object"}
                                    className="font-mono min-h-[100px]"
                                />
                            ) : (
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type={field.type === "number" ? "number" : "text"}
                                    defaultValue={String(defaultValue ?? "")}
                                    step={field.type === "number" ? "any" : undefined}
                                    placeholder={field.nullable ? "Optional" : undefined}
                                />
                            )}

                            {fieldError && (
                                <p className="text-sm text-destructive">{fieldError.join(", ")}</p>
                            )}
                        </div>
                    </div>
                );
            })}

            <div className="md:col-span-2">
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
