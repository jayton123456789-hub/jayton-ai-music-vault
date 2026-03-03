import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/server";

const users = [
  { username: "jayton", label: "Jayton" },
  { username: "dillon", label: "Dillon" },
  { username: "nick", label: "Nick" }
] as const;

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string; user?: string };
}) {
  const session = await getSession();

  if (session) {
    redirect("/home");
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-mesh">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(251,113,133,0.18),transparent_28%)]" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col justify-center px-6 py-10">
        <section className="glass-panel rounded-[2rem] border border-white/10 p-8 lg:p-12">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-300/80">Jayton Vault</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">Who are you?</h1>
          <p className="mt-4 text-base text-slate-300 md:text-lg">Pick profile and enter passcode</p>

          {searchParams?.error === "invalid" ? (
            <p className="mt-5 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
              Wrong passcode. Try again.
            </p>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {users.map((user) => (
              <form
                key={user.username}
                action="/api/auth/login"
                method="post"
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <input type="hidden" name="username" value={user.username} />
                <p className="text-2xl font-semibold text-white">{user.label}</p>
                <input
                  name="passcode"
                  type="password"
                  inputMode="numeric"
                  className="mt-4 w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-cyan-300/60"
                  placeholder="Passcode"
                  required
                />
                <button
                  type="submit"
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-sky-400 px-4 py-2 font-medium text-slate-950"
                >
                  Enter
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
