import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { VideosHub } from "@/components/videos-hub";
import { getSession } from "@/lib/auth/server";
import { listLyricVideos } from "@/lib/lyric-videos";
import { getPublishedTracks } from "@/lib/tracks";
import { getChannelVideos, getYoutubeChannelUrl } from "@/lib/youtube";

export default async function VideosPage({
  searchParams
}: {
  searchParams?: { trackId?: string };
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [tracks, lyricVideos, youtubeVideos] = await Promise.all([
    getPublishedTracks(),
    listLyricVideos(),
    getChannelVideos(14)
  ]);

  const channelUrl = getYoutubeChannelUrl();
  const initialTrackId = Number(searchParams?.trackId);

  return (
    <PortalShell
      currentPath="/videos"
      title="Video Vault"
      description="Create and watch lyric videos for every track, then manage your channel feed in one place."
      user={session}
    >
      <VideosHub
        user={session}
        tracks={tracks}
        lyricVideos={lyricVideos}
        youtubeVideos={youtubeVideos}
        channelUrl={channelUrl}
        initialTrackId={Number.isFinite(initialTrackId) ? initialTrackId : undefined}
      />
    </PortalShell>
  );
}
