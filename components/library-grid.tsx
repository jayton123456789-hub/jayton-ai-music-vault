"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { SerializedTrack } from "@/lib/tracks";

type LibraryGridProps = {
  tracks: SerializedTrack[];
};

export function LibraryGrid({ tracks }: LibraryGridProps) {
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
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-semibold text-white">{track.title}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-200">
                      {track.style.toLowerCase()}
                    </span>
                  </div>
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
                  <audio
                    controls
                    preload="none"
                    className="mt-5 w-full opacity-90"
                    src={track.audioPath}
                  >
                    Your browser does not support the audio element.
                  </audio>
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
