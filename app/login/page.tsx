import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth-screen";
import { getSession } from "@/lib/auth/server";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const session = await getSession();

  if (session) {
    redirect("/home");
  }

  const initialError =
    searchParams?.error === "invalid"
      ? "Wrong passcode. Try again."
      : searchParams?.error === "missing"
      ? "Username and passcode are required."
      : "";

  return <AuthScreen initialError={initialError} nextPath={searchParams?.next} />;
}
