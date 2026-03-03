import { redirect } from "next/navigation";

import { LibraryGrid } from "@/components/library-grid";
import { PortalShell } from "@/components/portal-shell";
import { getSession } from "@/lib/auth/server";
import { getPublishedTracks } from "@/lib/tracks";

export default async function LibraryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const tracks = await getPublishedTracks();

  return (
    <PortalShell
      currentPath="/library"
      title="Library"
      description="All tracks in one place."
      user={session}
    >
      <LibraryGrid tracks={tracks} />
    </PortalShell>
  );
}
