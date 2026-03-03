"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo, useState } from "react";

const identities = [
  { username: "jayton", label: "Jayton" },
  { username: "dillon", label: "Dillon" },
  { username: "nick", label: "Nick" }
] as const;

export function AuthScreen({ initialError }: { initialError?: string }) {
  const [selected, setSelected] = useState<(typeof identities)[number]>(identities[0]);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || "");

  const subtitle = useMemo(() => `Signing in as ${selected.label}`, [selected.label]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: selected.username, passcode }),
        credentials: "same-origin",
        signal: controller.signal
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error || "Login failed. Try again.");
        return;
      }

      window.location.href = "/home";
    } catch {
      setError("Login request timed out or failed. Try again.");
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040816] px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.22),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(249,115,22,0.17),transparent_30%),radial-gradient(circle_at_65%_25%,rgba(59,130,246,0.16),transparent_25%)]" />
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative w-full max-w-5xl rounded-[2rem] border border-cyan-200/10 bg-white/[0.04] p-6 shadow-[0_0_80px_rgba(14,165,233,0.18)] backdrop-blur-2xl md:p-10"
      >
        <div className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="relative mx-auto h-56 w-full max-w-md md:h-72">
              <Image
                src="/homiebeats-logo.jpg"
                alt="HOMIE BEATS"
                fill
                className="rounded-2xl object-cover shadow-[0_0_50px_rgba(56,189,248,0.25)]"
                priority
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#060d22]/80 p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Homie Beats</p>
            <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Enter Vault</h1>
            <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {identities.map((id) => {
                const active = id.username === selected.username;
                return (
                  <button
                    key={id.username}
                    type="button"
                    onClick={() => {
                      setSelected(id);
                      setPasscode("");
                      setError("");
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      active
                        ? "bg-cyan-300 text-slate-950"
                        : "border border-white/15 bg-white/5 text-slate-200 hover:border-white/30"
                    }`}
                  >
                    {id.label}
                  </button>
                );
              })}
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/70"
                required
              />

              {error ? (
                <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#3b82f6,#f97316)] px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Entering..." : "Enter"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
