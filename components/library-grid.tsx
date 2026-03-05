"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { SerializedTrack } from "@/lib/tracks";

type LibraryTrack = SerializedTrack & { lyricVideoSlug?: string | null };

type LibraryGridProps = {
  tracks: LibraryTrack[];
  canManageTracks?: boolean;
};

export function LibraryGrid({ tracks, canManageTracks = false }: LibraryGridProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  async function handleDelete(trackId: number) {
    setDeletingId(trackId);
    setError("");

    try {
      const response = await fetch(`/api/tracks/${trackId}`, {
        method: "DELETE"
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Delete failed.");
      }

      setOpenMenuId(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-amber-200/80">Track Library</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Browse every published upload
            </h2>
          </div>
          <p className="text-sm text-slate-300">{tracks.length} tracks available</p>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      {tracks.length ? (
        <section className="grid gap-6 xl:grid-cols-2">
          {tracks.map((track, index) => (
            <motion.article
              key={track.id}
              className="glass-panel overflow-hidden rounded-[2rem] border border-white/10 p-5"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: index * 0.04 }}
            >
              <div className="grid gap-5 md:grid-cols-[160px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/70">
                  <Image
                    src={track.coverPath}
                    alt={`${track.title} cover`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 160px"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-white">{track.title}</h3>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-200">
                        {track.style.toLowerCase()}
                      </span>
                    </div>

                    {canManageTracks ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((current) => (current === track.id ? null : track.id))
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-lg leading-none text-slate-200 hover:bg-white/10"
                          aria-label="Track actions"
                        >
                          ⋯
                        </button>

                        {openMenuId === track.id ? (
                          <div className="absolute right-0 z-10 mt-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-slate-950/95 shadow-xl">
                            <button
                              type="button"
                              onClick={() => handleDelete(track.id)}
                              disabled={deletingId === track.id}
                              className="w-full px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/15 disabled:opacity-60"
                            >
                              {deletingId === track.id ? "Deleting..." : "Delete song"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    By {track.createdByDisplayName} · {new Date(track.createdAt).toLocaleDateString()}
                    {track.releaseDate ? ` · Released ${new Date(track.releaseDate).toLocaleDateString()}` : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {track.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm text-slate-400">{track.lyrics}</p>
                  <audio controls preload="none" className="mt-5 w-full opacity-90" src={track.audioPath}>
                    Your browser does not support the audio element.
                  </audio>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={track.lyricVideoSlug ? `/videos/watch/${track.lyricVideoSlug}` : `/videos?trackId=${track.id}`}
                      className="rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/20"
                    >
                      {track.lyricVideoSlug ? "Watch Lyric Video" : "Create Lyric Video"}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      ) : (
        <section className="glass-panel rounded-[2rem] border border-dashed border-white/10 p-10 text-center">
          <p className="text-lg font-medium text-white">The library is empty</p>
          <p className="mt-3 text-sm text-slate-400">
            Upload a track from the studio to populate the vault.
          </p>
        </section>
      )}
    </div>
  );
}
