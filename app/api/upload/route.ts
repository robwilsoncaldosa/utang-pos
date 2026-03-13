import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFilePublicUrl, getStorageHealth, uploadFilesToSupabase } from "@/lib/upload/upload-service";
import { STORAGE_BUCKET } from "@/lib/supabase/storage";
import type { TablesUpdate } from "@/database.types";
import { getCurrentUserRole } from "@/lib/admin/roles";
import { can } from "@/lib/admin/permissions";
import crypto from "crypto";

type CorsContext = {
  allowOrigin: string;
};

function resolveCorsContext(request: Request): CorsContext | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return { allowOrigin: "*" };
  }
  const host = request.headers.get("host");
  if (!host) {
    return null;
  }
  const originHost = (() => {
    try {
      return new URL(origin).host;
    } catch {
      return "";
    }
  })();
  if (originHost !== host) {
    return null;
  }
  return { allowOrigin: origin };
}

function corsHeaders(allowOrigin: string) {
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

function logUploadViolation(payload: {
  requestId: string;
  route: string;
  userId: string | null;
  role: string | null;
  bucket: string;
  pathPrefix: string;
  reason: string;
  code: string;
}) {
  console.error(JSON.stringify({ level: "error", event: "storage_upload_violation", ...payload }));
}

export async function OPTIONS(request: Request) {
  const cors = resolveCorsContext(request);
  if (cors === null) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(cors.allowOrigin),
  });
}

export async function GET(request: Request) {
  const cors = resolveCorsContext(request);
  if (cors === null) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const width = Number(url.searchParams.get("width") ?? "");
  const quality = Number(url.searchParams.get("quality") ?? "");
  if (path) {
    const publicUrl = getFilePublicUrl(path, { bucket: STORAGE_BUCKET }, {
      width: Number.isFinite(width) && width > 0 ? width : undefined,
      quality: Number.isFinite(quality) && quality > 0 ? quality : undefined,
    });
    return NextResponse.json(
      {
        bucket: STORAGE_BUCKET,
        path,
        publicUrl,
      },
      { headers: corsHeaders(cors.allowOrigin) }
    );
  }
  const supabase = await createClient();
  const health = await getStorageHealth({ bucket: STORAGE_BUCKET }, { supabase });
  return NextResponse.json(health, { status: health.ok ? 200 : 503, headers: corsHeaders(cors.allowOrigin) });
}

export async function POST(request: Request) {
  const cors = resolveCorsContext(request);
  if (cors === null) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  try {
    const requestId = getRequestId(request);
    const auth = await getCurrentUserRole();
    if (!auth.user || !auth.role) {
      logUploadViolation({
        requestId,
        route: "/api/upload",
        userId: null,
        role: null,
        bucket: STORAGE_BUCKET,
        pathPrefix: "products",
        reason: "Authentication required",
        code: "auth_required",
      });
      return NextResponse.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders(cors.allowOrigin) });
    }
    if (!can(auth.role, "products", "create")) {
      logUploadViolation({
        requestId,
        route: "/api/upload",
        userId: auth.user.id,
        role: auth.role,
        bucket: STORAGE_BUCKET,
        pathPrefix: "products",
        reason: "Insufficient permissions",
        code: "role_forbidden",
      });
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403, headers: corsHeaders(cors.allowOrigin) });
    }

    const formData = await request.formData();
    const productId = String(formData.get("productId") ?? "").trim();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    if (!files.length) {
      return NextResponse.json(
        { error: "No files were provided. Use multipart/form-data with field name 'files'." },
        { status: 400, headers: corsHeaders(cors.allowOrigin) }
      );
    }

    const supabase = await createClient();
    const uploadResult = await uploadFilesToSupabase(files, {
      bucket: STORAGE_BUCKET,
      pathPrefix: "products",
    }, {
      supabase,
    });

    if (!uploadResult.uploaded.length) {
      if (uploadResult.failed.some((item) => item.code === "rls_blocked")) {
        logUploadViolation({
          requestId,
          route: "/api/upload",
          userId: auth.user.id,
          role: auth.role,
          bucket: STORAGE_BUCKET,
          pathPrefix: "products",
          reason: "RLS blocked INSERT on storage.objects",
          code: "rls_blocked",
        });
      }
      return NextResponse.json(
        {
          error: "Upload failed",
          failed: uploadResult.failed,
        },
        { status: 400, headers: corsHeaders(cors.allowOrigin) }
      );
    }

    let productUpdateError: string | null = null;
    if (productId) {
      const payload: TablesUpdate<"products"> = { image_url: uploadResult.uploaded[0].publicUrl };
      const { error: updateError } = await supabase.from("products").update(payload).eq("id", productId);
      if (updateError) {
        productUpdateError = updateError.message;
      }
    }

    return NextResponse.json(
      {
        bucket: uploadResult.config.bucket,
        uploaded: uploadResult.uploaded,
        failed: uploadResult.failed,
        publicUrl: uploadResult.uploaded[0].publicUrl,
        imageUrl: uploadResult.uploaded[0].publicUrl,
        productId: productId || null,
        productUpdated: productId ? productUpdateError === null : false,
        productUpdateError,
      },
      {
        status: uploadResult.failed.length || productUpdateError ? 207 : 200,
        headers: corsHeaders(cors.allowOrigin),
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected upload error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: corsHeaders(cors.allowOrigin) }
    );
  }
}
