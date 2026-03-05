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

const TRACKS_PREFIX = "portal/tracks/";
const SETTINGS_PREFIX = "portal/settings/";

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

export async function listTracksFromBlob(): Promise<PersistentTrack[]> {
  if (!isBlobEnabled) {
    return [];
  }

  const response = await list({ prefix: TRACKS_PREFIX, limit: 1000 });
  const blobs = response.blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

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

  const response = await list({ prefix: TRACKS_PREFIX, limit: 1000 });

  for (const blob of response.blobs) {
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

export async function readUploadSettingsFromBlob(): Promise<UploadAccessSettings> {
  if (!isBlobEnabled) {
    return defaultUploadSettings();
  }

  const response = await list({ prefix: SETTINGS_PREFIX, limit: 20 });

  if (!response.blobs.length) {
    return defaultUploadSettings();
  }

  const latest = response.blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )[0];

  const payload = await fetchBlobJson<Partial<UploadAccessSettings>>(latest.url);

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
