import { ProtectedPage } from "@/components/protected-page";

export default function FavoritesPage() {
  return (
    <ProtectedPage
      currentPath="/favorites"
      title="Favorites dashboard"
      description="This view keeps the same identity-aware tabs so each signed-in user gets a My Favorites tab and everyone else’s named tabs."
    />
  );
}
