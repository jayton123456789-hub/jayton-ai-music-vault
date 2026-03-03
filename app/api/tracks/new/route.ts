import { NextResponse } from "next/server";

import { getNewestTracks } from "@/lib/tracks";

export async function GET() {
  const tracks = await getNewestTracks(4);

  return NextResponse.json({ tracks });
}
