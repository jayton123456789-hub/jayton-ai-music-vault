import { del, list, put } from "@vercel/blob";

export type UploadAccessSettings = {
  allowDillonUpload: boolean;
  allowNickUpload: boolean;
};

export type PersistentTrack = {
  id: number;
  title: string;
  slug: string;
  audioPath: string;
  coverPath: string;
  lyrics: string;
  style: "MALE" | "FEMALE";
  tags: string[];
  sourceType: string;
  createdByUserId: number | null;
  createdByDisplayName: string;
  createdAt: string;
  updatedAt: string;
  releaseDate: string | null;
  isPublished: boolean;
};

export type PersistentLyricVideo = {
  id: number;
  title: string;
  slug: string;
  videoPath: string;
  trackId: number;
  trackSlug: string;
  trackTitle: string;
  trackAudioPath: string;
  trackCoverPath: string;
  trackLyrics: string;
  template: "NEON" | "DREAMY" | "CINEMATIC" | "AURORA";
  fontFamily: "INTER" | "MONTSERRAT" | "RALEWAY" | "BEBAS";
  lyricMode: "LINE" | "KARAOKE";
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  createdByUserId: number | null;
  createdByDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

const TRACKS_PREFIX = "portal/tracks/";
const SETTINGS_PREFIX = "portal/settings/";
const LYRIC_VIDEOS_PREFIX = "portal/lyric-videos/";

export const isBlobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function defaultUploadSettings(): UploadAccessSettings {
  return {
    allowDillonUpload: true,
    allowNickUpload: true
  };
}

async function fetchBlobJson<T>(url: string): Promise<T | null> {
  const response = await fetch(`${url}?ts=${Date.now()}`, { cache: "no-store" }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as T | null;
}

async function listBlobsSorted(prefix: string, limit = 1000) {
  const response = await list({ prefix, limit });

  return response.blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function listTracksFromBlob(): Promise<PersistentTrack[]> {
  if (!isBlobEnabled) {
    return [];
  }

  const blobs = await listBlobsSorted(TRACKS_PREFIX);
  const records = await Promise.all(blobs.map((blob) => fetchBlobJson<PersistentTrack>(blob.url)));

  return records.filter(Boolean) as PersistentTrack[];
}

function isBlobMediaUrl(value: string) {
  return value.includes(".public.blob.vercel-storage.com/");
}

export async function deleteTrackFromBlob(trackId: number) {
  if (!isBlobEnabled) {
    return false;
  }

  const blobs = await listBlobsSorted(TRACKS_PREFIX);

  for (const blob of blobs) {
    const record = await fetchBlobJson<PersistentTrack>(blob.url);

    if (!record || record.id !== trackId) {
      continue;
    }

    const targets: string[] = [blob.url];

    if (record.audioPath && isBlobMediaUrl(record.audioPath)) {
      targets.push(record.audioPath);
    }

    if (record.coverPath && isBlobMediaUrl(record.coverPath)) {
      targets.push(record.coverPath);
    }

    await del(targets).catch(() => null);
    return true;
  }

  return false;
}

export async function saveTrackToBlob(track: PersistentTrack) {
  if (!isBlobEnabled) {
    return;
  }

  const stamp = track.createdAt.replace(/[:.]/g, "-");
  const pathname = `${TRACKS_PREFIX}${stamp}-${track.slug}.json`;

  await put(pathname, JSON.stringify(track), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

export async function listLyricVideosFromBlob(): Promise<PersistentLyricVideo[]> {
  if (!isBlobEnabled) {
    return [];
  }

  const blobs = await listBlobsSorted(LYRIC_VIDEOS_PREFIX);
  const records = await Promise.all(blobs.map((blob) => fetchBlobJson<PersistentLyricVideo>(blob.url)));

  return records.filter(Boolean) as PersistentLyricVideo[];
}

export async function findLyricVideoByTrackIdInBlob(trackId: number) {
  const videos = await listLyricVideosFromBlob();
  return videos.find((video) => video.trackId === trackId) ?? null;
}

export async function findLyricVideoBySlugInBlob(slug: string) {
  const videos = await listLyricVideosFromBlob();
  return videos.find((video) => video.slug === slug) ?? null;
}

export async function saveLyricVideoToBlob(video: PersistentLyricVideo) {
  if (!isBlobEnabled) {
    return;
  }

  const pathname = `${LYRIC_VIDEOS_PREFIX}${video.trackId}.json`;

  await put(pathname, JSON.stringify(video), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

export async function deleteLyricVideoFromBlob(videoId: number) {
  if (!isBlobEnabled) {
    return false;
  }

  const blobs = await listBlobsSorted(LYRIC_VIDEOS_PREFIX);

  for (const blob of blobs) {
    const record = await fetchBlobJson<PersistentLyricVideo>(blob.url);

    if (!record || record.id !== videoId) {
      continue;
    }

    await del([blob.url]).catch(() => null);
    return true;
  }

  return false;
}

export async function readUploadSettingsFromBlob(): Promise<UploadAccessSettings> {
  if (!isBlobEnabled) {
    return defaultUploadSettings();
  }

  const blobs = await listBlobsSorted(SETTINGS_PREFIX, 20);

  if (!blobs.length) {
    return defaultUploadSettings();
  }

  const payload = await fetchBlobJson<Partial<UploadAccessSettings>>(blobs[0].url);

  return {
    allowDillonUpload:
      typeof payload?.allowDillonUpload === "boolean"
        ? payload.allowDillonUpload
        : true,
    allowNickUpload:
      typeof payload?.allowNickUpload === "boolean"
        ? payload.allowNickUpload
        : true
  };
}

export async function writeUploadSettingsToBlob(settings: UploadAccessSettings) {
  if (!isBlobEnabled) {
    return settings;
  }

  const pathname = `${SETTINGS_PREFIX}${Date.now()}.json`;

  await put(pathname, JSON.stringify(settings), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });

  return settings;
}

export async function uploadBlobFile(pathname: string, data: Blob | Buffer | string, contentType?: string) {
  if (!isBlobEnabled) {
    throw new Error("Blob storage is not configured.");
  }

  const uploaded = await put(pathname, data, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true
  });

  return uploaded.url;
}
