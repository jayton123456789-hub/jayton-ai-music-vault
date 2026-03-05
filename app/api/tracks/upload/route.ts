import { writeFile } from "fs/promises";

import { NextResponse } from "next/server";
import { parseBuffer } from "music-metadata";

import { getSession } from "@/lib/auth/server";
import { createTrack, canUserUpload, findTrackBySlug, type TrackStyle } from "@/lib/tracks";
import {
  ACCEPTED_AUDIO_EXTENSIONS,
  buildPlaceholderCoverSvg,
  buildUploadedPublicPath,
  createPlaceholderCover,
  createUniqueFileStem,
  ensureUploadDirectories,
  resolveAudioExtension,
  resolveUploadedFilePath,
  sanitizeBaseName,
  saveCoverFile,
  toJsonTagString
} from "@/lib/upload-utils";
import { generateTagsFromStylePrompt } from "@/lib/style-tags";
import { isBlobEnabled, uploadBlobFile } from "@/lib/persistent-store";

export const runtime = "nodejs";

const STYLE_VALUES = new Set<TrackStyle>(["MALE", "FEMALE"]);

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function invalidRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function buildUniqueSlug(title: string) {
  const base = sanitizeBaseName(title);
  let candidate = base;
  let counter = 2;

  while (await findTrackBySlug(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function coverExtensionFromMime(mimeType?: string) {
  const normalized = (mimeType || "").toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  return "jpg";
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return invalidRequest("Authentication required.", 401);
  }

  if (!(await canUserUpload(session.username))) {
    return invalidRequest("Uploads are disabled for this account.", 403);
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return invalidRequest("Invalid multipart form data.");
  }

  const audioFile = formData.get("audio");
  const title = String(formData.get("title") ?? "").trim();
  const lyrics = String(formData.get("lyrics") ?? "").trim();
  const style = String(formData.get("style") ?? "").trim().toUpperCase() as TrackStyle;
  const stylePrompt = String(formData.get("stylePrompt") ?? "").trim();
  const incomingTags = String(formData.get("tags") ?? "").trim();
  const tags = incomingTags || generateTagsFromStylePrompt(stylePrompt).join(", ");

  if (!title || !lyrics || !stylePrompt) {
    return invalidRequest("Title, lyrics, and Suno style are required.");
  }

  if (!tags) {
    return invalidRequest("Could not generate tags from Suno style.");
  }

  if (!STYLE_VALUES.has(style)) {
    return invalidRequest("Style must be MALE or FEMALE.");
  }

  if (!isUploadFile(audioFile)) {
    return invalidRequest("An audio file is required.");
  }

  const extension = resolveAudioExtension(audioFile.name, audioFile.type);

  if (!extension) {
    return invalidRequest(
      `Unsupported audio format. Accepted formats: ${ACCEPTED_AUDIO_EXTENSIONS.join(", ")}.`
    );
  }

  try {
    if (!isBlobEnabled) {
      await ensureUploadDirectories();
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const slug = await buildUniqueSlug(title);
    const fileStem = createUniqueFileStem(title);
    const audioFileName = `${fileStem}${extension}`;

    const audioPath = isBlobEnabled
      ? await uploadBlobFile(`uploads/audio/${audioFileName}`, buffer, audioFile.type || "audio/mpeg")
      : buildUploadedPublicPath("audio", audioFileName);

    if (!isBlobEnabled) {
      const audioFilePath = resolveUploadedFilePath("audio", audioFileName);
      await writeFile(audioFilePath, buffer);
    }

    let coverPath: string;
    let releaseDate: string | null = null;

    try {
      const metadata = (await parseBuffer(buffer)) as {
        common?: {
          picture?: Array<{ data: Uint8Array; format?: string }>;
          date?: string | Date;
          year?: number;
        };
      };

      const picture = metadata.common?.picture?.find((item) => item?.data?.length) ?? null;

      if (metadata.common?.date instanceof Date && !Number.isNaN(metadata.common.date.getTime())) {
        releaseDate = metadata.common.date.toISOString();
      } else if (typeof metadata.common?.date === "string") {
        const parsedDate = new Date(metadata.common.date);
        if (!Number.isNaN(parsedDate.getTime())) {
          releaseDate = parsedDate.toISOString();
        }
      } else if (typeof metadata.common?.year === "number" && metadata.common.year > 1900) {
        releaseDate = new Date(Date.UTC(metadata.common.year, 0, 1)).toISOString();
      }

      if (picture) {
        if (isBlobEnabled) {
          const ext = coverExtensionFromMime(picture.format);
          coverPath = await uploadBlobFile(
            `uploads/covers/${fileStem}-cover.${ext}`,
            Buffer.from(picture.data),
            picture.format || "image/jpeg"
          );
        } else {
          coverPath = await saveCoverFile(picture.data, picture.format || "image/jpeg", `${fileStem}-cover`);
        }
      } else if (isBlobEnabled) {
        coverPath = await uploadBlobFile(
          `uploads/covers/${fileStem}-cover.svg`,
          buildPlaceholderCoverSvg(title, style),
          "image/svg+xml"
        );
      } else {
        coverPath = await createPlaceholderCover(title, style, `${fileStem}-cover`);
      }
    } catch {
      if (isBlobEnabled) {
        coverPath = await uploadBlobFile(
          `uploads/covers/${fileStem}-cover.svg`,
          buildPlaceholderCoverSvg(title, style),
          "image/svg+xml"
        );
      } else {
        coverPath = await createPlaceholderCover(title, style, `${fileStem}-cover`);
      }
    }

    const track = await createTrack({
      title,
      slug,
      audioPath,
      coverPath,
      lyrics,
      style,
      tags: toJsonTagString(tags),
      createdByUserId: session.userId,
      releaseDate
    });

    return NextResponse.json({ ok: true, track }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return invalidRequest(message, 500);
  }
}
