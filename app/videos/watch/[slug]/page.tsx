import { notFound, redirect } from "next/navigation";

import { LyricVideoPlayer } from "@/components/lyric-video-player";
import { PortalShell } from "@/components/portal-shell";
import { getSession } from "@/lib/auth/server";
import { findLyricVideoBySlug } from "@/lib/lyric-videos";

export default async function LyricVideoWatchPage({
  params
}: {
  params: { slug: string };
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const video = await findLyricVideoBySlug(params.slug);

  if (!video) {
    notFound();
  }

  return (
    <PortalShell
      currentPath="/videos"
      title={video.title}
      description="Lyric video playback mode"
      user={session}
    >
      <LyricVideoPlayer video={video} />
    </PortalShell>
  );
}
