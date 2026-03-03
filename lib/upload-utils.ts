import { mkdir, writeFile } from "fs/promises";
import path from "path";

import type { TrackStyle } from "@/lib/tracks";

export const AUDIO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "audio");
export const COVER_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "covers");
export const DEFAULT_FALLBACK_COVER_PATH = "/uploads/covers/default-track-cover.svg";

const SUPPORTED_MIME_TYPES = new Map([
  ["audio/mpeg", ".mp3"],
  ["audio/mp3", ".mp3"],
  ["audio/wav", ".wav"],
  ["audio/x-wav", ".wav"],
  ["audio/wave", ".wav"],
  ["audio/mp4", ".m4a"],
  ["audio/x-m4a", ".m4a"],
  ["audio/aac", ".aac"],
  ["audio/ogg", ".ogg"],
  ["audio/flac", ".flac"],
  ["audio/x-flac", ".flac"]
]);

const IMAGE_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"]
]);

export const ACCEPTED_AUDIO_EXTENSIONS = Array.from(
  new Set(SUPPORTED_MIME_TYPES.values())
);

export function sanitizeBaseName(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "track";
}

export function toJsonTagString(value: string) {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return JSON.stringify(Array.from(new Set(tags)));
}

export function extensionFromFileName(fileName: string) {
  const parsed = path.parse(fileName).ext.toLowerCase();

  return parsed || "";
}

export function resolveAudioExtension(fileName: string, mimeType: string) {
  const mimeExtension = SUPPORTED_MIME_TYPES.get(mimeType.toLowerCase());
  const fileExtension = extensionFromFileName(fileName);

  if (mimeExtension) {
    return mimeExtension;
  }

  if (ACCEPTED_AUDIO_EXTENSIONS.includes(fileExtension)) {
    return fileExtension;
  }

  return "";
}

export function createUniqueFileStem(title: string) {
  const slug = sanitizeBaseName(title);
  const entropy = Math.random().toString(36).slice(2, 8);

  return `${Date.now()}-${slug}-${entropy}`;
}

export async function ensureUploadDirectories() {
  await Promise.all([
    mkdir(AUDIO_UPLOAD_DIR, { recursive: true }),
    mkdir(COVER_UPLOAD_DIR, { recursive: true })
  ]);
}

function buildGradientMarkup(title: string, style: TrackStyle) {
  const gradient =
    style === "FEMALE"
      ? ["#fb7185", "#f59e0b", "#fca5a5"]
      : ["#22d3ee", "#0ea5e9", "#a78bfa"];
  const safeTitle = title.replace(/[<>&"]/g, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" role="img" aria-label="${safeTitle}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradient[0]}" />
        <stop offset="48%" stop-color="${gradient[1]}" />
        <stop offset="100%" stop-color="${gradient[2]}" />
      </linearGradient>
      <filter id="blur">
        <feGaussianBlur stdDeviation="52" />
      </filter>
    </defs>
    <rect width="720" height="720" fill="#020617" />
    <circle cx="160" cy="150" r="150" fill="${gradient[0]}" opacity="0.55" filter="url(#blur)" />
    <circle cx="560" cy="220" r="170" fill="${gradient[1]}" opacity="0.35" filter="url(#blur)" />
    <circle cx="430" cy="540" r="220" fill="${gradient[2]}" opacity="0.3" filter="url(#blur)" />
    <rect x="54" y="54" width="612" height="612" rx="56" fill="url(#g)" fill-opacity="0.16" stroke="rgba(255,255,255,0.24)" />
    <text x="92" y="558" fill="white" font-family="sans-serif" font-size="54" font-weight="700">${safeTitle.slice(0, 20)}</text>
    <text x="94" y="606" fill="rgba(255,255,255,0.7)" font-family="sans-serif" font-size="24" letter-spacing="6">JAYTON AI MUSIC</text>
  </svg>`;
}

export async function createPlaceholderCover(title: string, style: TrackStyle, stem: string) {
  await ensureUploadDirectories();

  const fileName = `${stem}.svg`;
  const filePath = path.join(COVER_UPLOAD_DIR, fileName);

  await writeFile(filePath, buildGradientMarkup(title, style), "utf8");

  return `/uploads/covers/${fileName}`;
}

export async function saveCoverFile(data: Uint8Array, mimeType: string, stem: string) {
  await ensureUploadDirectories();

  const extension = IMAGE_EXTENSIONS.get(mimeType.toLowerCase()) || ".jpg";
  const fileName = `${stem}${extension}`;
  const filePath = path.join(COVER_UPLOAD_DIR, fileName);

  await writeFile(filePath, data);

  return `/uploads/covers/${fileName}`;
}
