import { ProtectedPage } from "@/components/protected-page";

export default function HomePage() {
  return (
    <ProtectedPage
      currentPath="/home"
      title="Private listening room"
      description="Your premium shell is live. Identity-aware favorites tabs update automatically for the active user while the rest of the portal stays behind the auth wall."
    />
  );
}
