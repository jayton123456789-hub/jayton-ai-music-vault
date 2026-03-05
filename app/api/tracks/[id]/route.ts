import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/server";
import { deleteTrackById } from "@/lib/tracks";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.username !== "jayton") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trackId = Number(params.id);

  if (!Number.isFinite(trackId) || trackId <= 0) {
    return NextResponse.json({ error: "Invalid track id." }, { status: 400 });
  }

  const deleted = await deleteTrackById(trackId);

  if (!deleted) {
    return NextResponse.json({ error: "Track not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
