"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import type { ChannelVideo } from "@/lib/youtube";

type VideosHubProps = {
  videos: ChannelVideo[];
  channelUrl: string;
};

export function VideosHub({ videos, channelUrl }: VideosHubProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string>(videos[0]?.id ?? "");
  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? videos[0],
    [selectedVideoId, videos]
  );

  if (!videos.length) {
    return (
      <section className="glass-panel rounded-[2rem] border border-white/10 p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Videos</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Channel feed unavailable</h2>
        <p className="mt-3 text-sm text-slate-300">
          We could not load the embedded feed right now. Open the channel directly to watch videos.
        </p>
        <a
          href={channelUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex rounded-2xl border border-cyan-300/35 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-300/20"
        >
          Open YouTube Channel
        </a>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Featured Player</p>
            <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
              {selectedVideo?.title}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{selectedVideo?.publishedLabel}</p>
          </div>
          <a
            href={channelUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-300/45 hover:text-cyan-200"
          >
            Visit Channel
          </a>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black">
          <div className="relative w-full pt-[56.25%]">
            <iframe
              key={selectedVideo?.id}
              src={`https://www.youtube-nocookie.com/embed/${selectedVideo?.id}?rel=0&modestbranding=1`}
              title={selectedVideo?.title ?? "Jayton AI Music video"}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Channel Feed</p>
        <div className="mt-4 grid max-h-[40rem] gap-3 overflow-y-auto pr-1">
          {videos.map((video) => {
            const active = video.id === selectedVideo?.id;

            return (
              <button
                key={video.id}
                type="button"
                onClick={() => setSelectedVideoId(video.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-cyan-300/45 bg-cyan-300/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div className="grid grid-cols-[120px_1fr] gap-3">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    width={120}
                    height={68}
                    className="h-[68px] w-[120px] rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="line-clamp-2 text-sm font-medium text-white">{video.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{video.publishedLabel}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
