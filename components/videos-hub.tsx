"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { SessionPayload } from "@/lib/auth/session";
import type { LyricVideo, LyricVideoFontFamily, LyricVideoLyricMode, LyricVideoTemplate } from "@/lib/lyric-videos";
import type { SerializedTrack } from "@/lib/tracks";
import type { ChannelVideo } from "@/lib/youtube";

type VideosHubProps = {
  user: SessionPayload;
  tracks: SerializedTrack[];
  lyricVideos: LyricVideo[];
  youtubeVideos: ChannelVideo[];
  channelUrl: string;
  initialTrackId?: number;
};

const TEMPLATE_OPTIONS: Array<{ value: LyricVideoTemplate; label: string; hint: string }> = [
  { value: "NEON", label: "Neon Trap", hint: "High contrast glow + energetic pulse" },
  { value: "DREAMY", label: "Dreamy", hint: "Soft gradients + floating ambience" },
  { value: "CINEMATIC", label: "Cinematic", hint: "Dark drama + spotlight warmth" },
  { value: "AURORA", label: "Aurora", hint: "Cool waves + atmospheric glow" }
];

const FONT_OPTIONS: Array<{ value: LyricVideoFontFamily; label: string }> = [
  { value: "INTER", label: "Inter" },
  { value: "MONTSERRAT", label: "Montserrat" },
  { value: "RALEWAY", label: "Raleway" },
  { value: "BEBAS", label: "Bebas Neue" }
];

const LYRIC_MODE_OPTIONS: Array<{ value: LyricVideoLyricMode; label: string }> = [
  { value: "LINE", label: "Line by line" },
  { value: "KARAOKE", label: "Karaoke highlight" }
];

const TEMPLATE_COLORS: Record<LyricVideoTemplate, { primary: string; secondary: string; accent: string }> = {
  NEON: { primary: "#22D3EE", secondary: "#0F172A", accent: "#F97316" },
  DREAMY: { primary: "#F472B6", secondary: "#312E81", accent: "#22D3EE" },
  CINEMATIC: { primary: "#F59E0B", secondary: "#020617", accent: "#EF4444" },
  AURORA: { primary: "#34D399", secondary: "#1E1B4B", accent: "#A78BFA" }
};

export function VideosHub({
  user,
  tracks,
  lyricVideos,
  youtubeVideos,
  channelUrl,
  initialTrackId
}: VideosHubProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedTrackId, setSelectedTrackId] = useState<number>(
    tracks.find((track) => track.id === initialTrackId)?.id ?? tracks[0]?.id ?? 0
  );
  const [template, setTemplate] = useState<LyricVideoTemplate>("NEON");
  const [fontFamily, setFontFamily] = useState<LyricVideoFontFamily>("INTER");
  const [lyricMode, setLyricMode] = useState<LyricVideoLyricMode>("LINE");
  const [primaryColor, setPrimaryColor] = useState<string>(TEMPLATE_COLORS.NEON.primary);
  const [secondaryColor, setSecondaryColor] = useState<string>(TEMPLATE_COLORS.NEON.secondary);
  const [accentColor, setAccentColor] = useState<string>(TEMPLATE_COLORS.NEON.accent);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedYoutubeId, setSelectedYoutubeId] = useState<string>(youtubeVideos[0]?.id ?? "");

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? tracks[0],
    [selectedTrackId, tracks]
  );

  const selectedYoutube = useMemo(
    () => youtubeVideos.find((video) => video.id === selectedYoutubeId) ?? youtubeVideos[0],
    [selectedYoutubeId, youtubeVideos]
  );

  const lyricVideoByTrackId = useMemo(
    () =>
      lyricVideos.reduce<Record<number, LyricVideo>>((acc, video) => {
        acc[video.trackId] = video;
        return acc;
      }, {}),
    [lyricVideos]
  );

  const selectedTrackVideo = selectedTrack ? lyricVideoByTrackId[selectedTrack.id] : null;

  async function handleCreateLyricVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTrack) {
      setError("Select a track first.");
      return;
    }

    setError("");
    setSuccess("");

    const payload = {
      trackId: selectedTrack.id,
      title: (title || `${selectedTrack.title} Lyric Video`).trim(),
      template,
      fontFamily,
      lyricMode,
      primaryColor,
      secondaryColor,
      accentColor
    };

    let response: Response;

    try {
      response = await fetch("/api/lyric-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {
      setError("Could not save lyric video settings.");
      return;
    }

    const body = (await response.json().catch(() => null)) as
      | { error?: string; video?: LyricVideo }
      | null;

    if (!response.ok) {
      setError(body?.error ?? "Could not save lyric video settings.");
      return;
    }

    setSuccess("Lyric video saved. You can watch it now.");

    startTransition(() => {
      router.refresh();
    });
  }

  function applyTemplatePalette(nextTemplate: LyricVideoTemplate) {
    setTemplate(nextTemplate);
    setPrimaryColor(TEMPLATE_COLORS[nextTemplate].primary);
    setSecondaryColor(TEMPLATE_COLORS[nextTemplate].secondary);
    setAccentColor(TEMPLATE_COLORS[nextTemplate].accent);
  }

  const hasTracks = tracks.length > 0;

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Lyric Video Studio</p>
            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              Build visual videos for every song
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Pick a track, choose visual style + font + colors, then save the lyric video to your site.
            </p>
          </div>
          {selectedTrackVideo ? (
            <Link
              href={selectedTrackVideo.videoPath}
              className="rounded-2xl border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100 transition hover:bg-emerald-300/20"
            >
              Watch Current Version
            </Link>
          ) : null}
        </div>

        {hasTracks ? (
          <form className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={handleCreateLyricVideo}>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                <span>Track</span>
                <select
                  value={selectedTrack?.id ?? 0}
                  onChange={(event) => {
                    const nextId = Number(event.target.value);
                    setSelectedTrackId(nextId);
                    const nextTrack = tracks.find((track) => track.id === nextId);
                    if (nextTrack) {
                      setTitle(`${nextTrack.title} Lyric Video`);
                    }
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                >
                  {tracks.map((track) => (
                    <option key={track.id} value={track.id} className="bg-slate-950">
                      {track.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                <span>Video title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={selectedTrack ? `${selectedTrack.title} Lyric Video` : "Lyric video title"}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                <span>Visual template</span>
                <select
                  value={template}
                  onChange={(event) => applyTemplatePalette(event.target.value as LyricVideoTemplate)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                >
                  {TEMPLATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-slate-950">
                      {option.label} — {option.hint}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Font</span>
                  <select
                    value={fontFamily}
                    onChange={(event) => setFontFamily(event.target.value as LyricVideoFontFamily)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                  >
                    {FONT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-950">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Lyric mode</span>
                  <select
                    value={lyricMode}
                    onChange={(event) => setLyricMode(event.target.value as LyricVideoLyricMode)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
                  >
                    {LYRIC_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-950">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Primary</span>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value.toUpperCase())}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-2"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Secondary</span>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(event) => setSecondaryColor(event.target.value.toUpperCase())}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-2"
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-300">
                  <span>Accent</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-2"
                  />
                </label>
              </div>

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
                disabled={isPending}
                className="rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(34,211,238,0.95),rgba(249,115,22,0.9))] px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-950 transition hover:brightness-110 disabled:opacity-50"
              >
                {isPending ? "Saving..." : selectedTrackVideo ? "Update Lyric Video" : "Create Lyric Video"}
              </button>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Live Preview</p>
              <div
                className="mt-4 relative h-72 overflow-hidden rounded-[1.4rem] border border-white/10"
                style={{
                  background: `radial-gradient(circle at 20% 20%, ${primaryColor}55 0%, transparent 42%), radial-gradient(circle at 80% 20%, ${accentColor}44 0%, transparent 44%), linear-gradient(145deg, ${secondaryColor}, #020617 70%)`
                }}
              >
                {selectedTrack ? (
                  <Image
                    src={selectedTrack.coverPath}
                    alt={`${selectedTrack.title} cover`}
                    fill
                    className="object-cover opacity-25 mix-blend-screen"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/65" />
                <div className="absolute inset-x-4 bottom-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">{template}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{selectedTrack?.title ?? "Track title"}</p>
                  <p className="mt-2 text-sm text-slate-200">
                    {selectedTrack?.lyrics.split(/\r?\n/).filter(Boolean)[0] ?? "Lyric line preview"}
                  </p>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
            Upload at least one track first, then you can generate lyric videos here.
          </div>
        )}
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">Saved Lyric Videos</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Ready to watch</h3>
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{lyricVideos.length} saved</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lyricVideos.length ? (
            lyricVideos.map((video) => (
              <article key={video.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4">
                <div
                  className="h-28 rounded-xl border border-white/10"
                  style={{
                    background: `linear-gradient(145deg, ${video.primaryColor}, ${video.secondaryColor} 72%)`
                  }}
                />
                <p className="mt-3 text-sm font-semibold text-white">{video.title}</p>
                <p className="mt-1 text-xs text-slate-400">{video.trackTitle}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  <span>{video.template}</span>
                  <span>{video.fontFamily}</span>
                  <span>{video.lyricMode}</span>
                </div>
                <Link
                  href={video.videoPath}
                  className="mt-4 inline-flex rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  Watch Lyric Video
                </Link>
              </article>
            ))
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400 md:col-span-2 xl:col-span-3">
              No lyric videos yet. Create your first one above.
            </div>
          )}
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">YouTube Channel Feed</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">External uploads</h3>
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

        {youtubeVideos.length ? (
          <div className="mt-5 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black">
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  key={selectedYoutube?.id}
                  src={`https://www.youtube-nocookie.com/embed/${selectedYoutube?.id}?rel=0&modestbranding=1`}
                  title={selectedYoutube?.title ?? "Jayton AI Music video"}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="grid max-h-[30rem] gap-3 overflow-y-auto pr-1">
              {youtubeVideos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setSelectedYoutubeId(video.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    video.id === selectedYoutube?.id
                      ? "border-cyan-300/45 bg-cyan-300/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="grid grid-cols-[110px_1fr] gap-3">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={110}
                      height={62}
                      className="h-[62px] w-[110px] rounded-xl object-cover"
                      loading="lazy"
                    />
                    <div>
                      <p className="line-clamp-2 text-sm font-medium text-white">{video.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{video.publishedLabel}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            Could not load YouTube channel feed right now.
          </div>
        )}
      </section>

      {user.username === "jayton" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
          Dev mode: lyric videos are currently rendered as dynamic visual players inside the site (no YouTube publish yet).
        </section>
      ) : null}
    </div>
  );
}
