"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { LyricVideo } from "@/lib/lyric-videos";

const FONT_FAMILY: Record<LyricVideo["fontFamily"], string> = {
  INTER: "Inter, system-ui, sans-serif",
  MONTSERRAT: "Montserrat, Inter, system-ui, sans-serif",
  RALEWAY: "Raleway, Inter, system-ui, sans-serif",
  BEBAS: '"Bebas Neue", Inter, system-ui, sans-serif'
};

function splitLyrics(lyrics: string) {
  const lines = lyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? lines : ["Instrumental"];
}

function getKaraokeWordProgress(currentLine: string, progress: number) {
  const words = currentLine.split(/\s+/).filter(Boolean);
  const activeWords = Math.max(1, Math.floor(words.length * progress));

  return words.map((word, index) => ({
    word,
    active: index < activeWords
  }));
}

export function LyricVideoPlayer({ video }: { video: LyricVideo }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [energy, setEnergy] = useState(0.08);

  const lines = useMemo(() => splitLyrics(video.trackLyrics), [video.trackLyrics]);

  const lineDuration = duration > 0 ? duration / lines.length : 0;
  const activeLineIndex =
    lineDuration > 0 ? Math.min(lines.length - 1, Math.floor(currentTime / lineDuration)) : 0;

  const currentLine = lines[activeLineIndex] ?? lines[0];
  const lineProgress =
    lineDuration > 0 ? Math.max(0, Math.min(1, (currentTime - activeLineIndex * lineDuration) / lineDuration)) : 0;

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      analyserRef.current?.disconnect();
      audioContextRef.current?.close().catch(() => null);
    };
  }, []);

  function tickEnergy() {
    const analyser = analyserRef.current;

    if (!analyser) {
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const avg = data.reduce((sum, value) => sum + value, 0) / (data.length || 1);
    const normalized = Math.min(1, Math.max(0, avg / 180));
    setEnergy((prev) => prev * 0.7 + normalized * 0.3);

    rafRef.current = requestAnimationFrame(tickEnergy);
  }

  async function ensureAudioAnalyser() {
    if (!audioRef.current) {
      return;
    }

    if (!audioContextRef.current) {
      const context = new AudioContext();
      const source = context.createMediaElementSource(audioRef.current);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyser.connect(context.destination);
      audioContextRef.current = context;
      analyserRef.current = analyser;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume().catch(() => null);
    }

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(tickEnergy);
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await ensureAudioAnalyser();
      await audio.play().catch(() => null);
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }

  return (
    <div className="grid gap-6">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 p-4 md:p-6">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 20%, ${video.primaryColor}66 0%, transparent 40%), radial-gradient(circle at 80% 20%, ${video.accentColor}55 0%, transparent 45%), linear-gradient(140deg, ${video.secondaryColor}, #020617 70%)`
          }}
        />

        <div
          className="absolute -left-16 -top-10 h-56 w-56 rounded-full blur-3xl transition-all duration-500"
          style={{
            backgroundColor: video.primaryColor,
            opacity: 0.2 + energy * 0.35,
            transform: `scale(${1 + energy * 0.5}) translate3d(${Math.sin(currentTime * 0.7) * 24}px, ${Math.cos(currentTime * 0.5) * 20}px, 0)`
          }}
        />

        <div
          className="absolute -bottom-12 right-[-3rem] h-64 w-64 rounded-full blur-3xl transition-all duration-500"
          style={{
            backgroundColor: video.accentColor,
            opacity: 0.18 + energy * 0.3,
            transform: `scale(${1 + energy * 0.35}) translate3d(${Math.cos(currentTime * 0.45) * 18}px, ${Math.sin(currentTime * 0.6) * 24}px, 0)`
          }}
        />

        <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="overflow-hidden rounded-[1.8rem] border border-white/15 bg-black/40">
            <div className="relative aspect-square lg:aspect-auto lg:h-full">
              <Image
                src={video.trackCoverPath}
                alt={`${video.trackTitle} cover`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 45vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/65" />
              <div className="absolute inset-x-4 bottom-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">{video.template}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{video.trackTitle}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                  By {video.createdByDisplayName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-[1.8rem] border border-white/10 bg-black/35 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/85">Lyric Video</p>
              <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{video.title}</h1>
              <p className="mt-2 text-sm text-slate-300">{video.trackTitle}</p>
            </div>

            <div className="rounded-[1.4rem] border border-white/15 bg-black/35 px-5 py-6 text-center">
              {video.lyricMode === "KARAOKE" ? (
                <p
                  className="text-2xl leading-relaxed md:text-3xl"
                  style={{ fontFamily: FONT_FAMILY[video.fontFamily] }}
                >
                  {getKaraokeWordProgress(currentLine, lineProgress).map((word, index) => (
                    <span
                      key={`${word.word}-${index}`}
                      style={{
                        color: word.active ? video.primaryColor : "rgba(226,232,240,0.86)",
                        textShadow: word.active ? `0 0 16px ${video.accentColor}` : "none"
                      }}
                    >
                      {word.word}{" "}
                    </span>
                  ))}
                </p>
              ) : (
                <p
                  className="text-2xl leading-relaxed text-white md:text-3xl"
                  style={{
                    fontFamily: FONT_FAMILY[video.fontFamily],
                    textShadow: `0 0 18px ${video.accentColor}88`
                  }}
                >
                  {currentLine}
                </p>
              )}

              <div className="mt-5 flex items-center justify-center gap-2">
                {lines.slice(Math.max(0, activeLineIndex - 1), activeLineIndex + 2).map((line, idx) => (
                  <span
                    key={`${line}-${idx}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === Math.min(1, activeLineIndex)
                        ? "w-10 bg-cyan-300"
                        : "w-4 bg-white/25"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <audio
                ref={audioRef}
                src={video.trackAudioPath}
                preload="metadata"
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="rounded-2xl border border-cyan-300/45 bg-cyan-300/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/25"
                >
                  {isPlaying ? "Pause Video" : "Play Video"}
                </button>

                <Link
                  href="/videos"
                  className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/35"
                >
                  Back to Studio
                </Link>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    background: `linear-gradient(90deg, ${video.primaryColor}, ${video.accentColor})`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/10 p-5">
        <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Lyrics Timeline</p>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
          {lines.map((line, index) => {
            const active = index === activeLineIndex;
            return (
              <p
                key={`${line}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  active ? "bg-cyan-300/15 text-cyan-100" : "bg-white/[0.03] text-slate-300"
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>
      </section>
    </div>
  );
}
