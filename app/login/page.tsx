import { redirect } from "next/navigation";

import { LoginExperience } from "@/components/login-experience";
import { getSession } from "@/lib/auth/server";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/home");
  }

  return <LoginExperience />;
}
