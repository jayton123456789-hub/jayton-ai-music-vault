import {
  createTrackRecord,
  getUploadAccessSettings,
  listPublishedTrackRecords,
  setUploadAccessSettings
} from "@/lib/track-store";

export type TrackStyle = "MALE" | "FEMALE";
export type UploadAccessSettings = {
  allowDillonUpload: boolean;
  allowNickUpload: boolean;
};

export type TrackRecord = {
  id: number;
  title: string;
  slug: string;
  audioPath: string;
  coverPath: string | null;
  lyrics: string;
  style: string;
  tags: string;
  sourceType: string;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  releaseDate: string | null;
  isPublished: number;
};

export type SerializedTrack = {
  id: number;
  title: string;
  slug: string;
  audioPath: string;
  coverPath: string;
  lyrics: string;
  style: TrackStyle;
  tags: string[];
  sourceType: string;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  releaseDate: string | null;
  isPublished: boolean;
};

function normalizeCoverPath(coverPath: string | null) {
  return coverPath || "/uploads/covers/default-track-cover.svg";
}

export function parseTrackTags(tags: string) {
  const trimmed = tags.trim();

  if (!trimmed) {
    return [] as string[];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => String(value).trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return trimmed
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function serializeTrack(track: TrackRecord): SerializedTrack {
  return {
    id: track.id,
    title: track.title,
    slug: track.slug,
    audioPath: track.audioPath,
    coverPath: normalizeCoverPath(track.coverPath),
    lyrics: track.lyrics,
    style: track.style as TrackStyle,
    tags: parseTrackTags(track.tags),
    sourceType: track.sourceType,
    createdByUserId: track.createdByUserId,
    createdAt: track.createdAt,
    updatedAt: track.updatedAt,
    releaseDate: track.releaseDate,
    isPublished: Boolean(track.isPublished)
  };
}

export async function getPublishedTracks(limit?: number) {
  const tracks = listPublishedTrackRecords(limit);

  return tracks.map(serializeTrack);
}

export async function getNewestTracks(limit = 4) {
  return getPublishedTracks(limit);
}

export async function createTrack(input: {
  title: string;
  slug: string;
  audioPath: string;
  coverPath: string;
  lyrics: string;
  style: TrackStyle;
  tags: string;
  createdByUserId: number;
}) {
  return serializeTrack(
    createTrackRecord({
      ...input,
      sourceType: "SUNO"
    })
  );
}

export function canUserUpload(username: string) {
  if (username === "jayton") {
    return true;
  }

  const settings = getUploadAccessSettings();

  if (username === "dillon") {
    return settings.allowDillonUpload;
  }

  if (username === "nick") {
    return settings.allowNickUpload;
  }

  return false;
}

export function getUploaderSettings() {
  return getUploadAccessSettings();
}

export function updateUploaderSettings(input: UploadAccessSettings) {
  return setUploadAccessSettings(input);
}
