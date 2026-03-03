import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth-screen";
import { getSession } from "@/lib/auth/server";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const session = await getSession();

  if (session) {
    redirect("/home");
  }

  return <AuthScreen initialError={searchParams?.error === "invalid" ? "Wrong passcode. Try again." : ""} />;
}
