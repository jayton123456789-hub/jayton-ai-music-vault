import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/server";

export default async function IndexPage() {
  const session = await getSession();

  redirect(session ? "/home" : "/login");
}
