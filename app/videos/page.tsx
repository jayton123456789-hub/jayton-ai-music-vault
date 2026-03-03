import { ProtectedPage } from "@/components/protected-page";

export default function VideosPage() {
  return (
    <ProtectedPage
      currentPath="/videos"
      title="Video exclusives"
      description="Exclusive video sections can now be added without reworking the authentication or protected-route shell."
    />
  );
}
