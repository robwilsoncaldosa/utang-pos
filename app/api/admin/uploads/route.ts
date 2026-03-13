import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { createCsrfToken, getCsrfCookieOptions, getCsrfHeaderValue, getCsrfToken, verifyCsrfToken } from "@/lib/admin/csrf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/admin/roles";
import { can, type Action, type TableName } from "@/lib/admin/permissions";
import { ADMIN_TABLE_CONFIGS, type AdminTableName, type AdminUploadConfig } from "@/lib/admin/entity-config";
import crypto from "crypto";

type UploadSuccessItem = {
  id: string;
  name: string;
  path: string;
  url: string;
  bucket: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

type UploadFailureItem = {
  name: string;
  reason: string;
};

function isAdminTableName(value: string): value is AdminTableName {
  return value in ADMIN_TABLE_CONFIGS;
}

function isPermissionTableName(value: string): value is TableName {
  return value === "categories" || value === "products" || value === "orders" || value === "order_items" || value === "user_roles";
}

function resolveUploadConfig(table: string | null, targetField: string | null): {
  tableName: AdminTableName;
  uploadConfig: AdminUploadConfig;
} | null {
  if (!table || !targetField) {
    return null;
  }
  if (!isAdminTableName(table)) {
    return null;
  }
  const tableConfig = ADMIN_TABLE_CONFIGS[table];
  const uploadConfig = tableConfig.uploads?.find((item) => item.targetField === targetField);
  if (!uploadConfig) {
    return null;
  }
  return { tableName: table, uploadConfig };
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function mapStorageErrorMessage(message: string, bucket: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("bucket not found")) {
    return `Storage bucket "${bucket}" was not found. Create the bucket in Supabase Storage and ensure it's public for image URLs.`;
  }
  if (normalized.includes("payload too large") || normalized.includes("entity too large")) {
    return "File exceeds storage payload limits.";
  }
  if (normalized.includes("row level security") || normalized.includes("permission")) {
    return "Storage policy blocked this request. Verify insert/select access on this bucket.";
  }
  return message;
}

async function assertAuthorized(tableName: string, action: Action) {
  const auth = await getCurrentUserRole();
  if (!auth.user || !auth.role) {
    return { error: NextResponse.json({ error: "Authentication required" }, { status: 401 }), user: null, role: null };
  }
  if (!isPermissionTableName(tableName)) {
    return { error: NextResponse.json({ error: "Unauthorized table access" }, { status: 403 }), user: auth.user, role: auth.role };
  }
  if (!can(auth.role, tableName, action)) {
    return { error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }), user: auth.user, role: auth.role };
  }
  return { error: null, user: auth.user, role: auth.role };
}

function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

function logUploadViolation(payload: {
  requestId: string;
  route: string;
  userId: string | null;
  role: string | null;
  table: string;
  targetField: string;
  bucket: string;
  pathPrefix: string;
  reason: string;
  code: string;
}) {
  console.error(JSON.stringify({ level: "error", event: "storage_upload_violation", ...payload }));
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const url = new URL(request.url);
  const table = url.searchParams.get("table");
  const targetField = url.searchParams.get("targetField");
  const resolved = resolveUploadConfig(table, targetField);
  if (!resolved) {
    return NextResponse.json({ error: "Invalid upload configuration request" }, { status: 400 });
  }
  const authorized = await assertAuthorized(resolved.tableName, "read");
  if (authorized.error) {
    return authorized.error;
  }

  const supabase = await createClient();
  const listPath = resolved.uploadConfig.pathPrefix || "";
  const { data: roots, error } = await supabase.storage
    .from(resolved.uploadConfig.bucket)
    .list(listPath, { limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } });
  if (error) {
    const mapped = mapStorageErrorMessage(error.message, resolved.uploadConfig.bucket);
    if (mapped.includes("Storage policy blocked")) {
      logUploadViolation({
        requestId,
        route: "/api/admin/uploads",
        userId: authorized.user?.id ?? null,
        role: authorized.role,
        table: resolved.tableName,
        targetField: resolved.uploadConfig.targetField,
        bucket: resolved.uploadConfig.bucket,
        pathPrefix: listPath,
        reason: "RLS blocked SELECT on storage.objects",
        code: "rls_blocked",
      });
    }
    return NextResponse.json({ error: mapStorageErrorMessage(error.message, resolved.uploadConfig.bucket) }, { status: 400 });
  }

  const files: Array<{ id: string | null; name: string; created_at: string | null; metadata: Record<string, unknown> }> = [];
  for (const item of roots ?? []) {
    if (!item.name) continue;
    const isFile = Boolean(item.metadata?.mimetype);
    if (isFile) {
      files.push({
        id: item.id ?? null,
        name: item.name,
        created_at: item.created_at ?? null,
        metadata: item.metadata ?? {},
      });
      continue;
    }
    const nestedPath = listPath ? `${listPath}/${item.name}` : item.name;
    const nested = await supabase.storage
      .from(resolved.uploadConfig.bucket)
      .list(nestedPath, { limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } });
    if (nested.error) continue;
    for (const nestedItem of nested.data ?? []) {
      if (!nestedItem.name || !nestedItem.metadata?.mimetype) continue;
      files.push({
        id: nestedItem.id ?? null,
        name: `${item.name}/${nestedItem.name}`,
        created_at: nestedItem.created_at ?? null,
        metadata: nestedItem.metadata ?? {},
      });
    }
  }

  const fullPaths = files.map((file) => (resolved.uploadConfig.pathPrefix ? `${resolved.uploadConfig.pathPrefix}/${file.name}` : file.name));

  const items = files.map((file, index) => ({
    id: file.id ?? `${file.name}-${index}`,
    name: file.name,
    path: fullPaths[index],
    size: Number(file.metadata?.size ?? 0),
    mimeType: String(file.metadata?.mimetype ?? ""),
    bucket: resolved.uploadConfig.bucket,
    uploadedAt: file.created_at ?? "",
    url: supabase.storage.from(resolved.uploadConfig.bucket).getPublicUrl(fullPaths[index]).data.publicUrl,
  }));

  const existingCsrf = await getCsrfToken();
  const csrfToken = existingCsrf ?? await createCsrfToken();
  const response = NextResponse.json({ items, csrfToken });
  if (!existingCsrf) {
    response.cookies.set("csrf_token", csrfToken, await getCsrfCookieOptions());
  }
  return response;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const formData = await request.formData();
  const resolved = resolveUploadConfig(
    String(formData.get("table") ?? ""),
    String(formData.get("targetField") ?? "")
  );
  if (!resolved) {
    return NextResponse.json({ error: "Invalid upload configuration request" }, { status: 400 });
  }
  const authorized = await assertAuthorized(resolved.tableName, "create");
  if (authorized.error) {
    return authorized.error;
  }

  const rateLimit = await checkRateLimit(100);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const csrfHeader = await getCsrfHeaderValue();
  const csrfOk = await verifyCsrfToken(csrfHeader);
  if (!csrfOk) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  if (files.length > resolved.uploadConfig.maxFiles) {
    return NextResponse.json(
      { error: `You can upload up to ${resolved.uploadConfig.maxFiles} files at a time` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const uploaded: UploadSuccessItem[] = [];
  const failed: UploadFailureItem[] = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (file.size > resolved.uploadConfig.maxSize) {
      failed.push({ name: file.name, reason: `File exceeds ${Math.round(resolved.uploadConfig.maxSize / (1024 * 1024))}MB` });
      continue;
    }
    const mime = file.type;
    if (!resolved.uploadConfig.allowedTypes.includes(mime)) {
      failed.push({ name: file.name, reason: "Unsupported file format" });
      continue;
    }
    const id = crypto.randomUUID();
    const cleanName = sanitizeFilename(file.name);
    const filePath = resolved.uploadConfig.pathPrefix
      ? `${resolved.uploadConfig.pathPrefix}/${new Date().toISOString().slice(0, 10)}/${id}-${cleanName}`
      : `${id}-${cleanName}`;
    const { error } = await supabase.storage
      .from(resolved.uploadConfig.bucket)
      .upload(filePath, file, { upsert: false, contentType: mime });
    if (error) {
      const reason = mapStorageErrorMessage(error.message, resolved.uploadConfig.bucket);
      failed.push({ name: file.name, reason });
      if (reason.includes("Storage policy blocked")) {
        logUploadViolation({
          requestId,
          route: "/api/admin/uploads",
          userId: authorized.user?.id ?? null,
          role: authorized.role,
          table: resolved.tableName,
          targetField: resolved.uploadConfig.targetField,
          bucket: resolved.uploadConfig.bucket,
          pathPrefix: resolved.uploadConfig.pathPrefix,
          reason: "RLS blocked INSERT on storage.objects",
          code: "rls_blocked",
        });
      }
      continue;
    }
    const { data } = supabase.storage.from(resolved.uploadConfig.bucket).getPublicUrl(filePath);
    uploaded.push({
      id,
      name: file.name,
      path: filePath,
      url: data.publicUrl,
      bucket: resolved.uploadConfig.bucket,
      mimeType: mime,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
  }

  if (uploaded.length === 0) {
    return NextResponse.json({ error: "Upload failed", failed }, { status: 400 });
  }

  return NextResponse.json(
    { items: uploaded, failed },
    { status: failed.length > 0 ? 207 : 200 }
  );
}
