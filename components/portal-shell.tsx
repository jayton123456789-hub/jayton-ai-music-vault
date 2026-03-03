"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { SessionPayload } from "@/lib/auth/session";

type PortalShellProps = {
  title: string;
  description: string;
  currentPath: string;
  user: SessionPayload;
  children?: React.ReactNode;
};

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/library", label: "Library" },
  { href: "/uploads", label: "Uploads" },
  { href: "/favorites", label: "Favorites" },
  { href: "/videos", label: "Videos" }
];

export function PortalShell({ title, description, currentPath, user, children }: PortalShellProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Jayton Vault</p>
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

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <motion.aside
            className="glass-panel rounded-[2rem] border border-white/10 p-4"
          >
            <nav className="grid gap-2">
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
          >
            {children ?? (
              <div className="glass-panel rounded-[2rem] border border-white/10 p-8 text-white/90">
                Ready.
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </main>
  );
}
