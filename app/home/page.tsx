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
      title="Private listening room"
      description="Your newest uploads now land in a featured front page while the same identity gate and protected navigation from Part 1 stay intact."
      user={session}
    >
      <HomeDashboard tracks={tracks} />
    </PortalShell>
  );
}
