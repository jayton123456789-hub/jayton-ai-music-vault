import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { VideosHub } from "@/components/videos-hub";
import { getSession } from "@/lib/auth/server";
import { getChannelVideos, getYoutubeChannelUrl } from "@/lib/youtube";

export default async function VideosPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const videos = await getChannelVideos(14);
  const channelUrl = getYoutubeChannelUrl();

  return (
    <PortalShell
      currentPath="/videos"
      title="Video Vault"
      description="Watch Jayton AI Music channel releases directly inside the portal."
      user={session}
    >
      <VideosHub videos={videos} channelUrl={channelUrl} />
    </PortalShell>
  );
}
