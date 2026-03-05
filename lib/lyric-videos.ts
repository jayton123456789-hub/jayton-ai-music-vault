import {
  deleteLyricVideoFromBlob,
  findLyricVideoBySlugInBlob,
  findLyricVideoByTrackIdInBlob,
  isBlobEnabled,
  listLyricVideosFromBlob,
  saveLyricVideoToBlob,
  type PersistentLyricVideo
} from "@/lib/persistent-store";
import {
  deleteVideoRecordById,
  findVideoRecordBySlug,
  findVideoRecordByTrackId,
  listVideoRecords,
  upsertVideoRecordForTrack,
  type RawVideoRecord
} from "@/lib/track-store";
import type { SerializedTrack } from "@/lib/tracks";
import { sanitizeBaseName } from "@/lib/upload-utils";

export type LyricVideoTemplate = "NEON" | "DREAMY" | "CINEMATIC" | "AURORA";
export type LyricVideoFontFamily = "INTER" | "MONTSERRAT" | "RALEWAY" | "BEBAS";
export type LyricVideoLyricMode = "LINE" | "KARAOKE";

export type LyricVideo = {
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
  template: LyricVideoTemplate;
  fontFamily: LyricVideoFontFamily;
  lyricMode: LyricVideoLyricMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  createdByUserId: number | null;
  createdByDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

type LyricVideoCustomization = {
  title: string;
  template: LyricVideoTemplate;
  fontFamily: LyricVideoFontFamily;
  lyricMode: LyricVideoLyricMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  createdByDisplayName: string;
};

type RawLyricVideoDescription = {
  trackSlug?: string;
  trackTitle?: string;
  trackAudioPath?: string;
  trackCoverPath?: string;
  trackLyrics?: string;
  template?: LyricVideoTemplate;
  fontFamily?: LyricVideoFontFamily;
  lyricMode?: LyricVideoLyricMode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  createdByDisplayName?: string;
};

const TEMPLATE_VALUES = new Set<LyricVideoTemplate>(["NEON", "DREAMY", "CINEMATIC", "AURORA"]);
const FONT_VALUES = new Set<LyricVideoFontFamily>(["INTER", "MONTSERRAT", "RALEWAY", "BEBAS"]);
const LYRIC_MODE_VALUES = new Set<LyricVideoLyricMode>(["LINE", "KARAOKE"]);

const TEMPLATE_DEFAULTS: Record<LyricVideoTemplate, { primary: string; secondary: string; accent: string }> = {
  NEON: { primary: "#22d3ee", secondary: "#0f172a", accent: "#f97316" },
  DREAMY: { primary: "#f472b6", secondary: "#312e81", accent: "#22d3ee" },
  CINEMATIC: { primary: "#f59e0b", secondary: "#020617", accent: "#ef4444" },
  AURORA: { primary: "#34d399", secondary: "#1e1b4b", accent: "#a78bfa" }
};

function normalizeHexColor(value: string | undefined, fallback: string) {
  const normalized = (value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toUpperCase();
  }
  return fallback;
}

function safeTemplate(value: string | undefined): LyricVideoTemplate {
  const candidate = (value || "").toUpperCase() as LyricVideoTemplate;
  return TEMPLATE_VALUES.has(candidate) ? candidate : "NEON";
}

function safeFont(value: string | undefined): LyricVideoFontFamily {
  const candidate = (value || "").toUpperCase() as LyricVideoFontFamily;
  return FONT_VALUES.has(candidate) ? candidate : "INTER";
}

function safeLyricMode(value: string | undefined): LyricVideoLyricMode {
  const candidate = (value || "").toUpperCase() as LyricVideoLyricMode;
  return LYRIC_MODE_VALUES.has(candidate) ? candidate : "LINE";
}

function ensureCoverPath(value: string | undefined) {
  return value || "/uploads/covers/default-track-cover.svg";
}

function videoPathFromSlug(slug: string) {
  return `/videos/watch/${slug}`;
}

function parseDescription(value: string | null | undefined): RawLyricVideoDescription {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as RawLyricVideoDescription;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function fromPersistent(record: PersistentLyricVideo): LyricVideo {
  return {
    ...record,
    trackCoverPath: ensureCoverPath(record.trackCoverPath),
    template: safeTemplate(record.template),
    fontFamily: safeFont(record.fontFamily),
    lyricMode: safeLyricMode(record.lyricMode),
    primaryColor: normalizeHexColor(record.primaryColor, TEMPLATE_DEFAULTS[safeTemplate(record.template)].primary),
    secondaryColor: normalizeHexColor(record.secondaryColor, TEMPLATE_DEFAULTS[safeTemplate(record.template)].secondary),
    accentColor: normalizeHexColor(record.accentColor, TEMPLATE_DEFAULTS[safeTemplate(record.template)].accent)
  };
}

function fromLocal(record: RawVideoRecord): LyricVideo | null {
  if (!record.videoPath.startsWith("/videos/watch/")) {
    return null;
  }

  const parsed = parseDescription(record.description);
  const template = safeTemplate(parsed.template);

  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    videoPath: record.videoPath,
    trackId: record.trackId ?? 0,
    trackSlug: parsed.trackSlug || "",
    trackTitle: parsed.trackTitle || record.title,
    trackAudioPath: parsed.trackAudioPath || "",
    trackCoverPath: ensureCoverPath(parsed.trackCoverPath),
    trackLyrics: parsed.trackLyrics || "",
    template,
    fontFamily: safeFont(parsed.fontFamily),
    lyricMode: safeLyricMode(parsed.lyricMode),
    primaryColor: normalizeHexColor(parsed.primaryColor, TEMPLATE_DEFAULTS[template].primary),
    secondaryColor: normalizeHexColor(parsed.secondaryColor, TEMPLATE_DEFAULTS[template].secondary),
    accentColor: normalizeHexColor(parsed.accentColor, TEMPLATE_DEFAULTS[template].accent),
    createdByUserId: record.createdByUserId,
    createdByDisplayName: parsed.createdByDisplayName || "Jayton",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export async function listLyricVideos() {
  if (isBlobEnabled) {
    const records = await listLyricVideosFromBlob();
    return records.map(fromPersistent).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return listVideoRecords()
    .map(fromLocal)
    .filter(Boolean)
    .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()) as LyricVideo[];
}

export async function findLyricVideoBySlug(slug: string) {
  if (isBlobEnabled) {
    const record = await findLyricVideoBySlugInBlob(slug);
    return record ? fromPersistent(record) : null;
  }

  const record = findVideoRecordBySlug(slug);
  return record ? fromLocal(record) : null;
}

export async function getLyricVideoMapByTrackId() {
  const videos = await listLyricVideos();
  return videos.reduce<Record<number, string>>((acc, video) => {
    if (video.trackId > 0) {
      acc[video.trackId] = video.slug;
    }
    return acc;
  }, {});
}

export async function createOrUpdateLyricVideo(input: {
  track: SerializedTrack;
  customization: LyricVideoCustomization;
  createdByUserId: number;
}) {
  const template = safeTemplate(input.customization.template);
  const defaults = TEMPLATE_DEFAULTS[template];

  const base = {
    title: input.customization.title.trim() || `${input.track.title} Lyric Video`,
    trackSlug: input.track.slug,
    trackTitle: input.track.title,
    trackAudioPath: input.track.audioPath,
    trackCoverPath: ensureCoverPath(input.track.coverPath),
    trackLyrics: input.track.lyrics,
    template,
    fontFamily: safeFont(input.customization.fontFamily),
    lyricMode: safeLyricMode(input.customization.lyricMode),
    primaryColor: normalizeHexColor(input.customization.primaryColor, defaults.primary),
    secondaryColor: normalizeHexColor(input.customization.secondaryColor, defaults.secondary),
    accentColor: normalizeHexColor(input.customization.accentColor, defaults.accent),
    createdByDisplayName: input.customization.createdByDisplayName
  };

  if (isBlobEnabled) {
    const existing = await findLyricVideoByTrackIdInBlob(input.track.id);
    const slug = existing?.slug || `${sanitizeBaseName(input.track.slug || input.track.title)}-lyric-video`;
    const now = new Date().toISOString();

    const record: PersistentLyricVideo = {
      id: existing?.id ?? Date.now(),
      ...base,
      trackId: input.track.id,
      slug,
      videoPath: videoPathFromSlug(slug),
      createdByUserId: input.createdByUserId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    await saveLyricVideoToBlob(record);
    return fromPersistent(record);
  }

  const existing = findVideoRecordByTrackId(input.track.id);
  const slug = existing?.slug || `${sanitizeBaseName(input.track.slug || input.track.title)}-lyric-video`;
  const description = JSON.stringify(base);

  const record = upsertVideoRecordForTrack({
    title: base.title,
    slug,
    videoPath: videoPathFromSlug(slug),
    description,
    createdByUserId: input.createdByUserId,
    trackId: input.track.id
  });

  if (!record) {
    return null;
  }

  return fromLocal(record);
}

export async function deleteLyricVideoById(videoId: number) {
  if (isBlobEnabled) {
    return deleteLyricVideoFromBlob(videoId);
  }

  return deleteVideoRecordById(videoId);
}
