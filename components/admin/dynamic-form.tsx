"use client";

import { useActionState, useRef, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, ChevronDown, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import type { AdminFieldConfig, AdminTableName, AdminUploadConfig } from "@/lib/admin/entity-config";
import { MediaManager } from "@/components/admin/media-manager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FormState = {
    message?: string;
    errors?: Record<string, string[]>;
    success?: boolean;
};

type DynamicFormProps = {
    fields: AdminFieldConfig[];
    action: (state: FormState, payload: FormData) => Promise<FormState>;
    defaultValues?: Record<string, unknown>;
    options?: Record<string, Array<{ label: string; value: string; imageUrl?: string }>>;
    submitLabel?: string;
    tableName?: AdminTableName;
    uploads?: AdminUploadConfig[];
};

type FormOption = { label: string; value: string; imageUrl?: string };
type UploadSelection = { url: string; name: string };

type UploadManagerDialogProps = {
    tableName: AdminTableName;
    upload: AdminUploadConfig;
    selectedAssetUrl?: string;
    selectedAssetName?: string;
    onSelectAsset: (selection: UploadSelection) => void;
    onRemoveAsset: () => void;
};

function UploadManagerDialog({
    tableName,
    upload,
    selectedAssetUrl,
    selectedAssetName,
    onSelectAsset,
    onRemoveAsset,
}: UploadManagerDialogProps) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rounded-lg border p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="flex items-start gap-3">
                    {selectedAssetUrl ? (
                        <img
                            src={selectedAssetUrl}
                            alt={selectedAssetName || upload.label}
                            className="h-16 w-16 rounded-md border object-cover"
                        />
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h4 className="text-sm font-semibold">{upload.label}</h4>
                        <p className="text-xs text-muted-foreground">
                            Single image only · JPG, PNG, GIF, WebP · {(upload.maxSize / (1024 * 1024)).toFixed(0)}MB max
                        </p>
                        <p className="mt-1 truncate text-xs text-foreground">
                            {selectedAssetName || "No image selected"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                                {selectedAssetUrl ? "Change Image" : "Select Image"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>{upload.label}</DialogTitle>
                                <DialogDescription>
                                    Upload one image or pick an existing asset.
                                </DialogDescription>
                            </DialogHeader>
                            <MediaManager
                                table={tableName}
                                targetField={upload.targetField}
                                bucket={upload.bucket}
                                allowedTypes={upload.allowedTypes}
                                maxSize={upload.maxSize}
                                maxFiles={upload.maxFiles}
                                onSelectAsset={(selection) => {
                                    onSelectAsset(selection);
                                    setOpen(false);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!selectedAssetUrl}
                        onClick={() => {
                            const shouldRemove = window.confirm("Remove the selected image from this form?");
                            if (!shouldRemove) return;
                            onRemoveAsset();
                        }}
                    >
                        Remove Image
                    </Button>
                </div>
            </div>
        </div>
    );
}

type ProductVisualSelectProps = {
    id: string;
    name: string;
    defaultValue: string;
    options: FormOption[];
    nullable?: boolean;
    hasError?: boolean;
};

function ProductVisualSelect({
    id,
    name,
    defaultValue,
    options,
    nullable,
    hasError,
}: ProductVisualSelectProps) {
    const [selectedValue, setSelectedValue] = useState(defaultValue);
    const selectedOption = options.find((option) => option.value === selectedValue);
    return (
        <div>
            <input id={id} name={name} type="hidden" value={selectedValue} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            "h-9 w-full justify-between px-3 font-normal",
                            hasError && "border-destructive focus-visible:ring-destructive/20"
                        )}
                    >
                        <span className="flex min-w-0 items-center gap-2">
                            {selectedOption?.imageUrl ? (
                                <img
                                    src={selectedOption.imageUrl}
                                    alt={selectedOption.label}
                                    className="h-6 w-6 rounded object-cover"
                                />
                            ) : (
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                </span>
                            )}
                            <span className="truncate text-left">
                                {selectedOption?.label ?? (nullable ? "None" : "Select product")}
                            </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                >
                    {nullable ? (
                        <DropdownMenuItem onSelect={() => setSelectedValue("")}>
                            <span className="flex flex-1 items-center gap-2">None</span>
                            {selectedValue === "" ? <Check className="h-4 w-4" /> : null}
                        </DropdownMenuItem>
                    ) : null}
                    {options.map((option) => (
                        <DropdownMenuItem key={option.value} onSelect={() => setSelectedValue(option.value)}>
                            <span className="flex flex-1 items-center gap-2">
                                {option.imageUrl ? (
                                    <img
                                        src={option.imageUrl}
                                        alt={option.label}
                                        className="h-6 w-6 rounded object-cover"
                                    />
                                ) : (
                                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                                        <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    </span>
                                )}
                                <span className="truncate">{option.label}</span>
                            </span>
                            {selectedValue === option.value ? <Check className="h-4 w-4" /> : null}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function DynamicForm({
    fields,
    action,
    defaultValues = {},
    options = {},
    submitLabel = "Save",
    tableName,
    uploads = [],
}: DynamicFormProps) {
    const [state, formAction, isPending] = useActionState(action, { message: "" });
    const formRef = useRef<HTMLFormElement | null>(null);
    const isEditMode = Boolean(defaultValues.id);
    const initialUploadValues = useMemo(
        () =>
            Object.fromEntries(
                uploads.map((upload) => [upload.targetField, String(defaultValues[upload.targetField] ?? "")])
            ) as Record<string, string>,
        [defaultValues, uploads]
    );
    const [uploadValues, setUploadValues] = useState<Record<string, string>>(initialUploadValues);
    const [uploadNames, setUploadNames] = useState<Record<string, string>>(
        Object.fromEntries(
            uploads.map((upload) => {
                const url = String(defaultValues[upload.targetField] ?? "");
                const raw = url.split("/").pop() ?? "";
                return [upload.targetField, raw || "No image selected"];
            })
        ) as Record<string, string>
    );

    useEffect(() => {
        if (state.success && state.message) {
            toast.success(state.message);
        } else if (state.message && !state.success) {
            toast.error(state.message);
        }
    }, [state]);

    const uploadTargetFields = useMemo(() => new Set(uploads.map((upload) => upload.targetField)), [uploads]);

    const applyUploadValue = (targetField: string, selection: UploadSelection) => {
        const input = formRef.current?.elements.namedItem(targetField);
        if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
            toast.error("Unable to apply the selected image");
            return;
        }
        input.value = selection.url;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        setUploadValues((prev) => ({ ...prev, [targetField]: selection.url }));
        setUploadNames((prev) => ({ ...prev, [targetField]: selection.name || "Selected image" }));
        toast.success("Selected image applied");
    };

    const clearUploadValue = (targetField: string) => {
        const input = formRef.current?.elements.namedItem(targetField);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        setUploadValues((prev) => ({ ...prev, [targetField]: "" }));
        setUploadNames((prev) => ({ ...prev, [targetField]: "No image selected" }));
        toast.success("Image removed");
    };

    return (
        <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
            {!!defaultValues.id && <input type="hidden" name="rowId" value={String(defaultValues.id)} />}

            {tableName && uploads.length > 0 ? (
                <div className="md:col-span-2 space-y-3">
                    {uploads.map((upload) => (
                        <UploadManagerDialog
                            key={`${upload.targetField}-${upload.bucket}`}
                            tableName={tableName}
                            upload={upload}
                            selectedAssetUrl={uploadValues[upload.targetField]}
                            selectedAssetName={uploadNames[upload.targetField]}
                            onSelectAsset={(selection) => applyUploadValue(upload.targetField, selection)}
                            onRemoveAsset={() => clearUploadValue(upload.targetField)}
                        />
                    ))}
                </div>
            ) : null}

            {fields.map((field) => {
                if (isEditMode && field.name === "created_at") {
                    return null;
                }
                if (uploadTargetFields.has(field.name)) {
                    return (
                        <input
                            key={field.name}
                            type="hidden"
                            id={field.name}
                            name={field.name}
                            value={uploadValues[field.name] ?? String(defaultValues[field.name] ?? "")}
                            readOnly
                        />
                    );
                }
                const fieldError = state.errors?.[field.name];
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

                            {field.type === "select" && field.relation?.table === "products" ? (
                                <ProductVisualSelect
                                    id={field.name}
                                    name={field.name}
                                    defaultValue={String(defaultValue ?? "")}
                                    options={fieldOptions}
                                    nullable={field.nullable}
                                    hasError={Boolean(fieldError)}
                                />
                            ) : field.type === "select" ? (
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
