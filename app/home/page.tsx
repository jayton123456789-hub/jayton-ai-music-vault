import { redirect } from "next/navigation";

import { HomeDashboard } from "@/components/home-dashboard";
import { PortalShell } from "@/components/portal-shell";
import { getSession } from "@/lib/auth/server";
import { getNewestTracks } from "@/lib/tracks";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const tracks = await getNewestTracks(4);

  return (
    <PortalShell
      currentPath="/home"
      title="Now Playing"
      description="Fresh drops and featured tracks."
      user={session}
    >
      <HomeDashboard tracks={tracks} canManageTracks={session.username === "jayton"} />
    </PortalShell>
  );
}
