import { redirect } from "next/navigation";

import { PortalShell } from "@/components/portal-shell";
import { UploadStudio } from "@/components/uploads-studio";
import { getSession } from "@/lib/auth/server";
import { getNewestTracks, getUploaderSettings } from "@/lib/tracks";

export default async function UploadsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const recentTracks = await getNewestTracks(4);
  const uploaderSettings = await getUploaderSettings();

  return (
    <PortalShell
      currentPath="/uploads"
      title="Upload Studio"
      description="Create and publish your next drop."
      user={session}
    >
      <UploadStudio
        user={session}
        recentTracks={recentTracks}
        initialSettings={uploaderSettings}
      />
    </PortalShell>
  );
}
