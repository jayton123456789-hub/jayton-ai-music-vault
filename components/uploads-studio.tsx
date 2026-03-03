"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { SessionPayload } from "@/lib/auth/session";
import type { SerializedTrack } from "@/lib/tracks";

type UploadStudioProps = {
  user: SessionPayload;
  recentTracks: SerializedTrack[];
};

const STYLE_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
] as const;

export function UploadStudio({ user, recentTracks }: UploadStudioProps) {
  const router = useRouter();
  const canUpload = user.username === "jayton";
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState<(typeof STYLE_OPTIONS)[number]["value"]>("MALE");
  const [tags, setTags] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const previewTags = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4);

  function handleFileSelection(nextFile: File | null) {
    setFile(nextFile);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canUpload || !file) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.set("audio", file);
    formData.set("title", title);
    formData.set("lyrics", lyrics);
    formData.set("style", style);
    formData.set("tags", tags);

    let response: Response;

    try {
      response = await fetch("/api/tracks/upload", {
        method: "POST",
        body: formData
      });
    } catch {
      setError("Upload failed.");
      setIsSubmitting(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(payload?.error ?? "Upload failed.");
      setIsSubmitting(false);
      return;
    }

    setSuccess("Track uploaded successfully. It is now live in the library.");
    setFile(null);
    setTitle("");
    setLyrics("");
    setStyle("MALE");
    setTags("");
    setIsSubmitting(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <motion.section
        className="glass-panel rounded-[2rem] border border-white/10 p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Upload Studio</p>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Shape the next drop inside the vault
          </h2>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Drag in an audio file, lock the vocal style, and add tags before publishing. Embedded
            cover art is extracted automatically when available.
          </p>
        </div>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
          {!canUpload ? (
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
              Uploads are restricted to the `jayton` account. You can still inspect the studio and
              recent drops from this view.
            </div>
          ) : null}

          <label
            className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.8rem] border border-dashed p-6 text-center transition ${
              isDragging
                ? "border-cyan-300/60 bg-cyan-300/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"
            } ${!canUpload ? "cursor-not-allowed opacity-60" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              if (canUpload) {
                setIsDragging(true);
              }
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);

              if (!canUpload) {
                return;
              }

              handleFileSelection(event.dataTransfer.files.item(0));
            }}
          >
            <input
              type="file"
              name="audio"
              accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,audio/*"
              disabled={!canUpload || isSubmitting}
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => handleFileSelection(event.target.files?.item(0) ?? null)}
            />
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.26em] text-slate-300">
              Audio file
            </span>
            <p className="mt-5 text-xl font-semibold text-white">
              {file ? file.name : "Drag and drop your track here"}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              MP3, WAV, M4A, AAC, OGG, and FLAC are accepted.
            </p>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={!canUpload || isSubmitting}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.07]"
                placeholder="Midnight Chrome"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-300">
              <span>Style</span>
              <select
                value={style}
                onChange={(event) => setStyle(event.target.value as "MALE" | "FEMALE")}
                disabled={!canUpload || isSubmitting}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.07]"
              >
                {STYLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm text-slate-300">
            <span>Lyrics</span>
            <textarea
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              disabled={!canUpload || isSubmitting}
              className="min-h-48 rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-4 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.07]"
              placeholder="Drop the full lyric sheet here..."
              required
            />
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span>Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              disabled={!canUpload || isSubmitting}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.07]"
              placeholder="anthemic, cinematic, late-night"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canUpload || !file || isSubmitting}
            className="rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(34,211,238,0.95),rgba(249,115,22,0.9))] px-5 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Uploading..." : "Publish Track"}
          </button>
        </form>
      </motion.section>

      <div className="grid gap-6">
        <motion.section
          className="glass-panel rounded-[2rem] border border-white/10 p-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-rose-200/75">Preview Card</p>
          <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/60 p-4">
            <div
              className={`relative h-56 rounded-[1.4rem] ${
                style === "FEMALE"
                  ? "bg-[linear-gradient(135deg,#7f1d1d,#f97316,#fb7185)]"
                  : "bg-[linear-gradient(135deg,#0f172a,#0ea5e9,#22d3ee)]"
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.18),transparent_25%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.12),transparent_32%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs uppercase tracking-[0.26em] text-white/70">{style}</p>
                <h3 className="mt-2 text-3xl font-semibold text-white">
                  {title || "Untitled Session"}
                </h3>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {(previewTags.length ? previewTags : ["new", "suno-style"]).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 line-clamp-5 text-sm text-slate-400">
                {lyrics || "Your lyric preview will appear here as you build the upload."}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="glass-panel rounded-[2rem] border border-white/10 p-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent Uploads</p>
          <div className="mt-5 grid gap-4">
            {recentTracks.length ? (
              recentTracks.map((track) => (
                <div
                  key={track.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{track.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                        {track.style}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(track.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                No uploaded tracks yet.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
