import { NextResponse } from "next/server";

import { getNewestTracks } from "@/lib/tracks";

export const dynamic = "force-dynamic";

export async function GET() {
  const tracks = await getNewestTracks(4);

  return NextResponse.json({ tracks });
}
