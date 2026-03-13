import {
    createStorageServerClient,
    STORAGE_ALLOWED_MIME_TYPES,
    STORAGE_BUCKET,
    STORAGE_MAX_FILE_SIZE_BYTES,
    STORAGE_MAX_FILES_PER_REQUEST,
} from "@/lib/supabase/storage";
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";

export type UploadValidationConfig = {
    bucket: string;
    maxFileSizeBytes: number;
    allowedMimeTypes: string[];
    pathPrefix?: string;
    maxFiles: number;
};

export type UploadResult = {
    fileName: string;
    path: string;
    publicUrl: string;
    mimeType: string;
    size: number;
};

export type UploadFailure = {
    fileName: string;
    error: string;
    code?: StorageErrorCode;
};

export type StorageHealth = {
    ok: boolean;
    bucket: string;
    error: string | null;
};

export type StorageErrorCode = "bucket_not_found" | "payload_too_large" | "rls_blocked" | "unknown";

export type StorageErrorDetails = {
    code: StorageErrorCode;
    message: string;
};

type UploadServiceOptions = {
    supabase?: SupabaseClient<Database>;
};

function sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function resolveConfig(config?: Partial<UploadValidationConfig>): UploadValidationConfig {
    return {
        bucket: config?.bucket ?? STORAGE_BUCKET,
        maxFileSizeBytes: config?.maxFileSizeBytes ?? STORAGE_MAX_FILE_SIZE_BYTES,
        allowedMimeTypes: config?.allowedMimeTypes?.length ? config.allowedMimeTypes : [...STORAGE_ALLOWED_MIME_TYPES],
        pathPrefix: config?.pathPrefix ?? "products",
        maxFiles: config?.maxFiles ?? STORAGE_MAX_FILES_PER_REQUEST,
    };
}

function validateFile(file: File, config: UploadValidationConfig): string | null {
    if (!config.allowedMimeTypes.includes(file.type)) {
        return "Unsupported file type";
    }
    if (file.size > config.maxFileSizeBytes) {
        return `File is larger than ${Math.round(config.maxFileSizeBytes / (1024 * 1024))}MB`;
    }
    return null;
}

function buildFilePath(fileName: string, pathPrefix?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const safeName = sanitizeFileName(fileName);
    const id = crypto.randomUUID();
    return pathPrefix ? `${pathPrefix}/${today}/${id}-${safeName}` : `${today}/${id}-${safeName}`;
}

export function parseStorageError(message: string, bucket: string): StorageErrorDetails {
    const normalized = message.toLowerCase();
    if (normalized.includes("bucket not found")) {
        return {
            code: "bucket_not_found",
            message: `Storage bucket "${bucket}" was not found. Create the bucket in Supabase Storage and set it to public for website images.`,
        };
    }
    if (normalized.includes("payload too large") || normalized.includes("entity too large")) {
        return { code: "payload_too_large", message: "File is too large for current storage limits." };
    }
    if (normalized.includes("row level security") || normalized.includes("permission")) {
        return {
            code: "rls_blocked",
            message: "Storage policy blocked this operation. Confirm insert/select policies for the bucket.",
        };
    }
    return { code: "unknown", message };
}

export async function getStorageHealth(config?: Partial<UploadValidationConfig>, options?: UploadServiceOptions): Promise<StorageHealth> {
    const resolvedConfig = resolveConfig(config);
    const supabase = options?.supabase ?? createStorageServerClient();
    const { error } = await supabase.storage.from(resolvedConfig.bucket).list("", { limit: 1 });
    if (error) {
        const details = parseStorageError(error.message, resolvedConfig.bucket);
        return {
            ok: false,
            bucket: resolvedConfig.bucket,
            error: details.message,
        };
    }
    return { ok: true, bucket: resolvedConfig.bucket, error: null };
}

export function getFilePublicUrl(path: string, config?: Partial<UploadValidationConfig>, optimize?: { width?: number; quality?: number }) {
    const resolvedConfig = resolveConfig(config);
    const supabase = createStorageServerClient();
    const transform = optimize?.width || optimize?.quality
        ? { width: optimize.width, quality: optimize.quality }
        : undefined;
    const { data } = supabase.storage.from(resolvedConfig.bucket).getPublicUrl(path, transform ? { transform } : undefined);
    return data.publicUrl;
}

export async function uploadFilesToSupabase(files: File[], config?: Partial<UploadValidationConfig>, options?: UploadServiceOptions) {
    const resolvedConfig = resolveConfig(config);
    const supabase = options?.supabase ?? createStorageServerClient();
    const uploaded: UploadResult[] = [];
    const failed: UploadFailure[] = [];

    if (files.length > resolvedConfig.maxFiles) {
        return {
            uploaded,
            failed: [{ fileName: "batch", error: `You can upload up to ${resolvedConfig.maxFiles} files per request.` }],
            config: resolvedConfig,
        };
    }

    for (const file of files) {
        const validationError = validateFile(file, resolvedConfig);
        if (validationError) {
            failed.push({ fileName: file.name, error: validationError });
            continue;
        }

        const path = buildFilePath(file.name, resolvedConfig.pathPrefix);
        const { error: uploadError } = await supabase.storage
            .from(resolvedConfig.bucket)
            .upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) {
            const details = parseStorageError(uploadError.message, resolvedConfig.bucket);
            failed.push({ fileName: file.name, error: details.message, code: details.code });
            continue;
        }

        uploaded.push({
            fileName: file.name,
            path,
            publicUrl: getFilePublicUrl(path, resolvedConfig),
            mimeType: file.type,
            size: file.size,
        });
    }

    return { uploaded, failed, config: resolvedConfig };
}
