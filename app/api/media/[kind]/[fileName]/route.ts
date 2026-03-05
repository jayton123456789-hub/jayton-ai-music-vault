import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { resolveUploadedFilePath } from "@/lib/upload-utils";

export const runtime = "nodejs";

type Params = {
  kind: string;
  fileName: string;
};

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

export async function GET(
  _request: Request,
  { params }: { params: Params }
) {
  const kind = params.kind === "audio" || params.kind === "covers" ? params.kind : null;
  const fileName = params.fileName;

  if (!kind || !fileName || fileName.includes("..") || fileName.includes("/")) {
    return NextResponse.json({ error: "Invalid media path." }, { status: 400 });
  }

  const filePath = resolveUploadedFilePath(kind, decodeURIComponent(fileName));

  try {
    const data = await readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }
}
