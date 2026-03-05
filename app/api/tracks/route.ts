import { NextResponse } from "next/server";

import { getPublishedTracks } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export async function GET() {
  const tracks = await getPublishedTracks();

  return NextResponse.json({ tracks });
}
