import { ProtectedPage } from "@/components/protected-page";

export default function UploadsPage() {
  return (
    <ProtectedPage
      currentPath="/uploads"
      title="Upload control room"
      description="Upload tooling will plug into this shell next. The auth boundary and session handling are already in place."
    />
  );
}
