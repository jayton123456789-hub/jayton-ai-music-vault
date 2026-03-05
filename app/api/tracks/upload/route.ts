import { writeFile } from "fs/promises";

import { NextResponse } from "next/server";
import { parseBuffer } from "music-metadata";

import { getSession } from "@/lib/auth/server";
import { findTrackRecordBySlug } from "@/lib/track-store";
import { canUserUpload, createTrack, type TrackStyle } from "@/lib/tracks";
import {
  ACCEPTED_AUDIO_EXTENSIONS,
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

export const runtime = "nodejs";

const STYLE_VALUES = new Set<TrackStyle>(["MALE", "FEMALE"]);

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function buildUniqueSlug(title: string) {
  const base = sanitizeBaseName(title);
  let candidate = base;
  let counter = 2;

  while (findTrackRecordBySlug(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function invalidRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return invalidRequest("Authentication required.", 401);
  }

  if (!canUserUpload(session.username)) {
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
    await ensureUploadDirectories();

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const slug = await buildUniqueSlug(title);
    const fileStem = createUniqueFileStem(title);
    const audioFileName = `${fileStem}${extension}`;
    const audioPath = buildUploadedPublicPath("audio", audioFileName);
    const audioFilePath = resolveUploadedFilePath("audio", audioFileName);

    await writeFile(audioFilePath, buffer);

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

      coverPath = picture
        ? await saveCoverFile(picture.data, picture.format || "image/jpeg", `${fileStem}-cover`)
        : await createPlaceholderCover(title, style, `${fileStem}-cover`);
    } catch {
      coverPath = await createPlaceholderCover(title, style, `${fileStem}-cover`);
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

    return NextResponse.json(
      {
        ok: true,
        track
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return invalidRequest(message, 500);
  }
}
