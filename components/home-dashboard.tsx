"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { SerializedTrack } from "@/lib/tracks";

type HomeDashboardProps = {
  tracks: SerializedTrack[];
};

export function HomeDashboard({ tracks }: HomeDashboardProps) {
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
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-cyan-100">
                      {track.style.toLowerCase()}
                    </span>
                    <span className="text-xs uppercase tracking-[0.26em] text-slate-400">
                      {new Date(track.createdAt).toLocaleDateString()}
                    </span>
                  </div>
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
