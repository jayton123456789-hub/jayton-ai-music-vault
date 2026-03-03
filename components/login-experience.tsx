"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";

import { PORTAL_IDENTITIES } from "@/lib/portal";

export function LoginExperience() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<(typeof PORTAL_IDENTITIES)[number] | null>(
    null
  );
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const subtitle = useMemo(() => {
    if (!selectedUser) {
      return "Select your profile";
    }

    return `Enter passcode for ${selectedUser.displayName}`;
  }, [selectedUser]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: selectedUser.username,
        passcode
      })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Unable to sign in.");
      return;
    }

    startTransition(() => {
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-mesh">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(251,113,133,0.18),transparent_28%)]" />
      <motion.div
        className="relative mx-auto flex w-full max-w-6xl flex-col justify-center px-6 py-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <section className="glass-panel rounded-[2rem] border border-white/10 p-8 lg:p-12">
          <div className="mb-10 max-w-2xl">
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-300/80">Jayton Vault</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">Who are you?</h1>
            <p className="mt-4 text-base text-slate-300 md:text-lg">{subtitle}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PORTAL_IDENTITIES.map((identity, index) => {
              const active = selectedUser?.username === identity.username;

              return (
                <motion.button
                  key={identity.username}
                  type="button"
                  onClick={() => {
                    setSelectedUser(identity);
                    setPasscode("");
                    setError("");
                  }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className={`rounded-3xl border p-5 text-left transition ${
                    active
                      ? "border-cyan-300/70 bg-cyan-300/10"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/8"
                  }`}
                >
                  <p className="text-2xl font-semibold text-white">{identity.displayName}</p>
                </motion.button>
              );
            })}
          </div>
        </section>
      </motion.div>

      <AnimatePresence>
        {selectedUser ? (
          <motion.div
            className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handleSubmit}
              className="glass-panel w-full max-w-md rounded-[2rem] border border-white/10 p-8"
              initial={{ scale: 0.96, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">{selectedUser.displayName}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setPasscode("");
                    setError("");
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300 transition hover:border-white/30 hover:text-white"
                >
                  Close
                </button>
              </div>

              <label className="mt-8 block">
                <span className="text-sm text-slate-300">Passcode</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-lg text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-cyan-300/60"
                  placeholder="••••"
                  required
                />
              </label>

              {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

              <button
                type="submit"
                disabled={isPending}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-400 px-4 py-3 font-medium text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Entering..." : "Enter"}
              </button>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
