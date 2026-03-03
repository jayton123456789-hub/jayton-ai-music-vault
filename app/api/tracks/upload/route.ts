import { writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import { parseBuffer } from "music-metadata";

import { getSession } from "@/lib/auth/server";
import { findTrackRecordBySlug } from "@/lib/track-store";
import { createTrack, type TrackStyle } from "@/lib/tracks";
import {
  AUDIO_UPLOAD_DIR,
  ACCEPTED_AUDIO_EXTENSIONS,
  createPlaceholderCover,
  createUniqueFileStem,
  ensureUploadDirectories,
  resolveAudioExtension,
  sanitizeBaseName,
  saveCoverFile,
  toJsonTagString
} from "@/lib/upload-utils";

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

  if (session.username !== "jayton") {
    return invalidRequest("Only jayton can upload tracks.", 403);
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return invalidRequest("Invalid multipart form data.");
  }

  const audioFile = formData.get("audio");
  const title = String(formData.get("title") ?? "").trim();
  const lyrics = String(formData.get("lyrics") ?? "").trim();
  const style = String(formData.get("style") ?? "").trim().toUpperCase() as TrackStyle;
  const tags = String(formData.get("tags") ?? "").trim();

  if (!title || !lyrics || !tags) {
    return invalidRequest("Title, lyrics, and tags are required.");
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

  await ensureUploadDirectories();

  const buffer = Buffer.from(await audioFile.arrayBuffer());
  const slug = await buildUniqueSlug(title);
  const fileStem = createUniqueFileStem(title);
  const audioFileName = `${fileStem}${extension}`;
  const audioPath = `/uploads/audio/${audioFileName}`;
  const audioFilePath = path.join(AUDIO_UPLOAD_DIR, audioFileName);

  await writeFile(audioFilePath, buffer);

  let coverPath: string;

  try {
    const metadata = await parseBuffer(buffer);
    const picture = metadata.common.picture?.[0];

    coverPath =
      picture?.data?.length && picture.format
        ? await saveCoverFile(picture.data, picture.format, `${fileStem}-cover`)
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
    createdByUserId: session.userId
  });

  return NextResponse.json(
    {
      ok: true,
      track
    },
    { status: 201 }
  );
}
