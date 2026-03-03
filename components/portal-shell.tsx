"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { SessionPayload } from "@/lib/auth/session";
import { buildFavoriteTabs } from "@/lib/portal";

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/uploads", label: "Uploads" },
  { href: "/favorites", label: "Favorites" },
  { href: "/videos", label: "Videos" }
];

type PortalShellProps = {
  title: string;
  description: string;
  currentPath: string;
  user: SessionPayload;
};

export function PortalShell({
  title,
  description,
  currentPath,
  user
}: PortalShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("mine");
  const [isPending, startTransition] = useTransition();
  const tabs = buildFavoriteTabs(user.username);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST"
    });

    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,234,212,0.16),transparent_26%),radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_80%_80%,rgba(251,113,133,0.15),transparent_24%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6">
        <motion.header
          className="glass-panel rounded-[2rem] border border-white/10 p-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">
                Welcome back
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-5xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in</p>
                <p className="mt-1 text-lg font-semibold text-white">{user.displayName}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
              >
                Sign out
              </button>
            </div>
          </div>
        </motion.header>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <motion.aside
            className="glass-panel rounded-[2rem] border border-white/10 p-5"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <p className="px-2 text-xs uppercase tracking-[0.3em] text-slate-400">Navigate</p>
            <nav className="mt-5 grid gap-2">
              {navItems.map((item) => {
                const active = currentPath === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-cyan-300/12 text-cyan-200"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.aside>

          <motion.section
            className="grid gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
          >
            <div className="glass-panel rounded-[2rem] border border-white/10 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-rose-300/75">
                    Favorites View
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Personalized tabs follow your identity
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          active
                            ? "bg-white text-slate-950"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="glass-panel rounded-[2rem] border border-white/10 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">Now viewing</p>
                <h3 className="mt-3 text-3xl font-semibold text-white">
                  {tabs.find((tab) => tab.key === activeTab)?.label}
                </h3>
                <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
                  This shell is ready for premium music data. Part 1 establishes the identity gate,
                  protected routing, and personalized navigation so the next phase can layer in real
                  content without changing the auth boundary.
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {["Curated uploads", "Private favorites", "Video exclusives"].map(
                    (item, index) => (
                      <motion.div
                        key={item}
                        className="rounded-3xl border border-white/10 bg-white/5 p-4"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.18 + index * 0.06 }}
                      >
                        <p className="text-sm font-medium text-white">{item}</p>
                        <p className="mt-2 text-sm text-slate-400">
                          Locked behind the same server-issued vault session.
                        </p>
                      </motion.div>
                    )
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-[2rem] border border-white/10 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Access Model</p>
                <ul className="mt-5 grid gap-4 text-sm text-slate-300">
                  <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    Identity cards initiate the login flow.
                  </li>
                  <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    Passcodes are checked against bcrypt hashes in SQLite through Prisma.
                  </li>
                  <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    Middleware rejects protected routes without a valid signed cookie.
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
