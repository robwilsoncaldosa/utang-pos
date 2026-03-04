import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { getCsrfHeaderValue, verifyCsrfToken } from "@/lib/admin/csrf";
import sharp from "sharp";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const uploadDir = path.join(process.cwd(), "public", "uploads");

function getExtension(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

async function ensureDir() {
  await mkdir(uploadDir, { recursive: true });
}

export async function GET() {
  await ensureDir();
  const files = await readdir(uploadDir);
  const items = await Promise.all(
    files.map(async (file) => {
      const full = path.join(uploadDir, file);
      const info = await stat(full);
      return {
        name: file,
        size: info.size,
        url: `/uploads/${file}`,
      };
    })
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(100);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const csrfHeader = await getCsrfHeaderValue();
  const csrfOk = await verifyCsrfToken(csrfHeader);
  if (!csrfOk) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  await ensureDir();
  const results: Array<{
    id: string;
    url: string;
    thumbnails: { sm: string; md: string; lg: string };
  }> = [];

  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 10MB limit" }, { status: 400 });
    }
    const mime = file.type;
    if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
      return NextResponse.json({ error: "Unsupported file format" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width < 400 || metadata.height < 400) {
      return NextResponse.json({ error: "Minimum resolution is 400x400px" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const ext = getExtension(mime);
    const mainName = `${id}-main.${ext}`;
    const smName = `${id}-sm.${ext}`;
    const mdName = `${id}-md.${ext}`;
    const lgName = `${id}-lg.${ext}`;

    const mainBuffer = await image
      .clone()
      .resize({ width: 1600, height: 1600, fit: "inside" })
      .toFormat(ext === "png" ? "png" : "webp", { quality: 85 })
      .toBuffer();
    const smBuffer = await image.clone().resize(150, 150).toFormat("webp", { quality: 85 }).toBuffer();
    const mdBuffer = await image.clone().resize(300, 300).toFormat("webp", { quality: 85 }).toBuffer();
    const lgBuffer = await image.clone().resize(600, 600).toFormat("webp", { quality: 85 }).toBuffer();

    await writeFile(path.join(uploadDir, mainName), mainBuffer);
    await writeFile(path.join(uploadDir, smName), smBuffer);
    await writeFile(path.join(uploadDir, mdName), mdBuffer);
    await writeFile(path.join(uploadDir, lgName), lgBuffer);

    results.push({
      id,
      url: `/uploads/${mainName}`,
      thumbnails: {
        sm: `/uploads/${smName}`,
        md: `/uploads/${mdName}`,
        lg: `/uploads/${lgName}`,
      },
    });
  }

  return NextResponse.json({ items: results });
}
