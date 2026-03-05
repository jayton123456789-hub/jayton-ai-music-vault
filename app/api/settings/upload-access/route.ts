import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/server";
import { getUploaderSettings, updateUploaderSettings } from "@/lib/tracks";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({ settings: await getUploaderSettings() });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.username !== "jayton") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { allowDillonUpload?: unknown; allowNickUpload?: unknown }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const current = await getUploaderSettings();
  const hasDillon = typeof body.allowDillonUpload === "boolean";
  const hasNick = typeof body.allowNickUpload === "boolean";

  if (!hasDillon && !hasNick) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const settings = await updateUploaderSettings({
    allowDillonUpload: hasDillon
      ? (body.allowDillonUpload as boolean)
      : current.allowDillonUpload,
    allowNickUpload: hasNick ? (body.allowNickUpload as boolean) : current.allowNickUpload
  });

  return NextResponse.json({ settings });
}
