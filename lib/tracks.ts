import {
  createTrackRecord,
  findTrackRecordBySlug,
  getUploadAccessSettings,
  listPublishedTrackRecords,
  setUploadAccessSettings
} from "@/lib/track-store";
import {
  isBlobEnabled,
  mutatePersistentState,
  readPersistentState,
  type PersistentTrack,
  type UploadAccessSettings
} from "@/lib/persistent-store";

export type TrackStyle = "MALE" | "FEMALE";
export type { UploadAccessSettings } from "@/lib/persistent-store";

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
  createdByDisplayName: string;
  createdAt: string;
  updatedAt: string;
  releaseDate: string | null;
  isPublished: boolean;
};

function normalizeCoverPath(coverPath: string | null) {
  return coverPath || "/uploads/covers/default-track-cover.svg";
}

function getUploaderDisplayName(userId: number | null) {
  if (userId === 1) return "Jayton";
  if (userId === 2) return "Dillon";
  if (userId === 3) return "Nick";
  return "Unknown";
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
    createdByDisplayName: getUploaderDisplayName(track.createdByUserId),
    createdAt: track.createdAt,
    updatedAt: track.updatedAt,
    releaseDate: track.releaseDate,
    isPublished: Boolean(track.isPublished)
  };
}

function fromPersistentTrack(track: PersistentTrack): SerializedTrack {
  return {
    ...track,
    coverPath: normalizeCoverPath(track.coverPath)
  };
}

export async function findTrackBySlug(slug: string) {
  if (isBlobEnabled) {
    const state = await readPersistentState();
    const track = state?.tracks.find((item) => item.slug === slug) ?? null;
    return track ? fromPersistentTrack(track) : null;
  }

  const record = findTrackRecordBySlug(slug);
  return record ? serializeTrack(record) : null;
}

export async function getPublishedTracks(limit?: number) {
  if (isBlobEnabled) {
    const state = await readPersistentState();
    const tracks = (state?.tracks ?? [])
      .filter((track) => track.isPublished)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(fromPersistentTrack);

    return typeof limit === "number" ? tracks.slice(0, limit) : tracks;
  }

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
  releaseDate?: string | null;
}) {
  if (isBlobEnabled) {
    return mutatePersistentState((state) => {
      const now = new Date().toISOString();
      const maxId = state.tracks.reduce((acc, item) => Math.max(acc, item.id), 0);
      const track: PersistentTrack = {
        id: maxId + 1,
        title: input.title,
        slug: input.slug,
        audioPath: input.audioPath,
        coverPath: normalizeCoverPath(input.coverPath),
        lyrics: input.lyrics,
        style: input.style,
        tags: parseTrackTags(input.tags),
        sourceType: "SUNO",
        createdByUserId: input.createdByUserId,
        createdByDisplayName: getUploaderDisplayName(input.createdByUserId),
        createdAt: now,
        updatedAt: now,
        releaseDate: input.releaseDate ?? null,
        isPublished: true
      };

      state.tracks.unshift(track);
      return track;
    }).then(fromPersistentTrack);
  }

  return serializeTrack(
    createTrackRecord({
      ...input,
      sourceType: "SUNO"
    })
  );
}

export async function getUploaderSettings() {
  if (isBlobEnabled) {
    const state = await readPersistentState();
    return (
      state?.settings ?? {
        allowDillonUpload: true,
        allowNickUpload: true
      }
    );
  }

  return getUploadAccessSettings();
}

export async function updateUploaderSettings(input: UploadAccessSettings) {
  if (isBlobEnabled) {
    return mutatePersistentState((state) => {
      state.settings.allowDillonUpload = input.allowDillonUpload;
      state.settings.allowNickUpload = input.allowNickUpload;
      return state.settings;
    });
  }

  return setUploadAccessSettings(input);
}

export async function canUserUpload(username: string) {
  if (username === "jayton") {
    return true;
  }

  const settings = await getUploaderSettings();

  if (username === "dillon") {
    return settings.allowDillonUpload;
  }

  if (username === "nick") {
    return settings.allowNickUpload;
  }

  return false;
}
