import { list, put } from "@vercel/blob";

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

type PersistentState = {
  tracks: PersistentTrack[];
  settings: UploadAccessSettings;
};

const STATE_PATH = "portal/state.json";

export const isBlobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function getDefaultState(): PersistentState {
  return {
    tracks: [],
    settings: {
      allowDillonUpload: true,
      allowNickUpload: true
    }
  };
}

function normalizeState(value: Partial<PersistentState> | null | undefined): PersistentState {
  const defaults = getDefaultState();

  return {
    tracks: Array.isArray(value?.tracks) ? value!.tracks : defaults.tracks,
    settings: {
      allowDillonUpload:
        typeof value?.settings?.allowDillonUpload === "boolean"
          ? value.settings.allowDillonUpload
          : defaults.settings.allowDillonUpload,
      allowNickUpload:
        typeof value?.settings?.allowNickUpload === "boolean"
          ? value.settings.allowNickUpload
          : defaults.settings.allowNickUpload
    }
  };
}

export async function readPersistentState(): Promise<PersistentState | null> {
  if (!isBlobEnabled) {
    return null;
  }

  const response = await list({ prefix: STATE_PATH, limit: 1 });
  const blob = response.blobs.find((item) => item.pathname === STATE_PATH) ?? response.blobs[0];

  if (!blob) {
    return getDefaultState();
  }

  const file = await fetch(blob.url, { cache: "no-store" }).catch(() => null);

  if (!file?.ok) {
    return getDefaultState();
  }

  const payload = (await file.json().catch(() => null)) as Partial<PersistentState> | null;
  return normalizeState(payload);
}

export async function writePersistentState(state: PersistentState) {
  if (!isBlobEnabled) {
    return;
  }

  await put(STATE_PATH, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

export async function mutatePersistentState<T>(
  mutator: (current: PersistentState) => T | Promise<T>
) {
  const current = (await readPersistentState()) ?? getDefaultState();
  const result = await mutator(current);
  await writePersistentState(current);
  return result;
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
