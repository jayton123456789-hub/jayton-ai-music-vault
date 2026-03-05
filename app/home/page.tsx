import { redirect } from "next/navigation";

import { HomeDashboard } from "@/components/home-dashboard";
import { PortalShell } from "@/components/portal-shell";
import { getSession } from "@/lib/auth/server";
import { getLyricVideoMapByTrackId } from "@/lib/lyric-videos";
import { getNewestTracks } from "@/lib/tracks";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [tracks, lyricVideoMap] = await Promise.all([
    getNewestTracks(4),
    getLyricVideoMapByTrackId()
  ]);

  const tracksWithVideos = tracks.map((track) => ({
    ...track,
    lyricVideoSlug: lyricVideoMap[track.id] ?? null
  }));

  return (
    <PortalShell
      currentPath="/home"
      title="Now Playing"
      description="Fresh drops and featured tracks."
      user={session}
    >
      <HomeDashboard tracks={tracksWithVideos} canManageTracks={session.username === "jayton"} />
    </PortalShell>
  );
}
