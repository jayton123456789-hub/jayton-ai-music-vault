import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/server";
import {
  createOrUpdateLyricVideo,
  listLyricVideos,
  type LyricVideoFontFamily,
  type LyricVideoLyricMode,
  type LyricVideoTemplate
} from "@/lib/lyric-videos";
import { canUserUpload, getPublishedTracks } from "@/lib/tracks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  trackId?: number;
  title?: string;
  template?: LyricVideoTemplate;
  fontFamily?: LyricVideoFontFamily;
  lyricMode?: LyricVideoLyricMode;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return badRequest("Authentication required.", 401);
  }

  const videos = await listLyricVideos();
  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return badRequest("Authentication required.", 401);
  }

  if (!(await canUserUpload(session.username))) {
    return badRequest("You do not have permission to create lyric videos.", 403);
  }

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const trackId = Number(body?.trackId);

  if (!Number.isFinite(trackId) || trackId <= 0) {
    return badRequest("Valid trackId is required.");
  }

  const tracks = await getPublishedTracks();
  const track = tracks.find((item) => item.id === trackId);

  if (!track) {
    return badRequest("Track not found.", 404);
  }

  const video = await createOrUpdateLyricVideo({
    track,
    createdByUserId: session.userId,
    customization: {
      title: body?.title || `${track.title} Lyric Video`,
      template: body?.template || "NEON",
      fontFamily: body?.fontFamily || "INTER",
      lyricMode: body?.lyricMode || "LINE",
      primaryColor: body?.primaryColor || "#22D3EE",
      secondaryColor: body?.secondaryColor || "#0F172A",
      accentColor: body?.accentColor || "#F97316",
      createdByDisplayName: session.displayName
    }
  });

  if (!video) {
    return badRequest("Failed to create lyric video.", 500);
  }

  return NextResponse.json({ ok: true, video }, { status: 201 });
}
