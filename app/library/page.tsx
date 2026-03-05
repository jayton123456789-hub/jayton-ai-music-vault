import { redirect } from "next/navigation";

import { LibraryGrid } from "@/components/library-grid";
import { PortalShell } from "@/components/portal-shell";
import { getSession } from "@/lib/auth/server";
import { getLyricVideoMapByTrackId } from "@/lib/lyric-videos";
import { getPublishedTracks } from "@/lib/tracks";

export default async function LibraryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [tracks, lyricVideoMap] = await Promise.all([
    getPublishedTracks(),
    getLyricVideoMapByTrackId()
  ]);

  const tracksWithVideos = tracks.map((track) => ({
    ...track,
    lyricVideoSlug: lyricVideoMap[track.id] ?? null
  }));

  return (
    <PortalShell
      currentPath="/library"
      title="Library"
      description="All tracks in one place."
      user={session}
    >
      <LibraryGrid tracks={tracksWithVideos} canManageTracks={session.username === "jayton"} />
    </PortalShell>
  );
}
