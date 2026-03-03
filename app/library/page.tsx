import { ProtectedPage } from "@/components/protected-page";

export default function LibraryPage() {
  return (
    <ProtectedPage
      currentPath="/library"
      title="Vault library"
      description="This route is middleware-protected and already inherits the personalized favorites tab strip for the active identity."
    />
  );
}
