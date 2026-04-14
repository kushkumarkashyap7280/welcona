import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { createSupabaseServiceClient } from "@/lib/supabase";
import { getSupabaseStorageBucket, isSupabaseStoragePath } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

function sanitizeFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      filename?: string;
      mimeType?: string;
      size?: number;
    };

    const filename = body.filename?.trim() ?? "";
    const mimeType = body.mimeType?.trim() ?? "";
    const size = Number(body.size ?? 0);

    if (!filename || !mimeType || !Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
    }

    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be 2MB or smaller" }, { status: 400 });
    }

    const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
    const safeExt = (ext || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const baseName = sanitizeFilename(filename.replace(/\.[^.]+$/, "")) || "image";
    const path = `products/${Date.now()}-${crypto.randomUUID()}-${baseName}.${safeExt}`;

    const bucket = getSupabaseStorageBucket();
    const supabase = createSupabaseServiceClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data?.token) {
      const reason = error?.message || "Storage rejected signed upload request";
      return NextResponse.json({ error: `Failed to prepare upload: ${reason}` }, { status: 500 });
    }

    return NextResponse.json({
      bucket,
      path,
      token: data.token,
      maxSizeBytes: MAX_FILE_SIZE_BYTES,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: `Failed to prepare upload: ${reason}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      path?: string;
    };

    const path = body.path?.trim() ?? "";
    if (!path || !isSupabaseStoragePath(path)) {
      return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
    }

    const bucket = getSupabaseStorageBucket();
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return NextResponse.json({ error: `Failed to delete image: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: `Failed to delete image: ${reason}` }, { status: 500 });
  }
}
