"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { SerializedTrack } from "@/lib/tracks";

type HomeDashboardProps = {
  tracks: SerializedTrack[];
  canManageTracks?: boolean;
};

export function HomeDashboard({ tracks, canManageTracks = false }: HomeDashboardProps) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
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
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">New Uploads</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Fresh drops, front and center
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              The newest uploads land here first, styled like featured hero tiles so the latest
              sessions feel immediate.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.28em] text-slate-300">
            {tracks.length} live now
          </div>
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
              className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 p-5"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.12),transparent_28%)]" />
              <div className="relative grid gap-5 md:grid-cols-[240px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/70">
                  <Image
                    src={track.coverPath}
                    alt={`${track.title} cover`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 240px"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-100">
                        {track.style.toLowerCase()}
                      </span>
                      <span className="text-xs uppercase tracking-[0.26em] text-slate-400">
                        {new Date(track.createdAt).toLocaleDateString()}
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
                    By {track.createdByDisplayName}
                    {track.releaseDate ? ` · Released ${new Date(track.releaseDate).toLocaleDateString()}` : ""}
                  </p>

                  <h3 className="mt-4 text-3xl font-semibold text-white">{track.title}</h3>
                  <p className="mt-3 line-clamp-4 text-sm text-slate-300 md:text-base">
                    {track.lyrics}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {track.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>
      ) : (
        <section className="glass-panel rounded-[2rem] border border-dashed border-white/10 p-10 text-center">
          <p className="text-lg font-medium text-white">No uploads yet</p>
          <p className="mt-3 text-sm text-slate-400">
            New tracks will appear here as soon as they are uploaded.
          </p>
        </section>
      )}
    </div>
  );
}
