import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { getSession } from "@/lib/auth/server";

type ProtectedPageProps = {
  currentPath: string;
  title: string;
  description: string;
};

export async function ProtectedPage({
  currentPath,
  title,
  description
}: ProtectedPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <PortalShell
      currentPath={currentPath}
      title={title}
      description={description}
      user={session}
    />
  );
}
