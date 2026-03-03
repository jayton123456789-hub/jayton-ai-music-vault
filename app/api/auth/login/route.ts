import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type LoginBody = {
  username?: string;
  passcode?: string;
};

const FALLBACK_USERS: Record<string, { passcode: string; displayName: string; id: number }> = {
  jayton: { passcode: "1987", displayName: "Jayton", id: 1 },
  dillon: { passcode: "3141", displayName: "Dillon", id: 2 },
  nick: { passcode: "3141", displayName: "Nick", id: 3 }
};

function badRequestJson() {
  return NextResponse.json({ error: "Username and passcode are required." }, { status: 400 });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const wantsHtml = request.headers.get("accept")?.includes("text/html") ?? false;

  let username = "";
  let passcode = "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as LoginBody | null;
    username = body?.username?.trim() || "";
    passcode = body?.passcode?.trim() || "";
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    username = String(form?.get("username") ?? "").trim();
    passcode = String(form?.get("passcode") ?? "").trim();
  }

  if (!username || !passcode) {
    return wantsHtml ? NextResponse.redirect(new URL("/login?error=missing", request.url)) : badRequestJson();
  }

  const fallback = FALLBACK_USERS[username.toLowerCase()];

  let resolvedUser: { id: number; username: string; displayName: string } | null = null;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (user) {
      const matches = await bcrypt.compare(passcode, user.passcodeHash);
      if (matches) {
        resolvedUser = {
          id: user.id,
          username: user.username,
          displayName: user.displayName
        };
      }
    }
  } catch {
    // fallback below
  }

  if (!resolvedUser && fallback && passcode === fallback.passcode) {
    resolvedUser = {
      id: fallback.id,
      username: username.toLowerCase(),
      displayName: fallback.displayName
    };
  }

  if (!resolvedUser) {
    return wantsHtml
      ? NextResponse.redirect(new URL(`/login?error=invalid&user=${encodeURIComponent(username)}`, request.url))
      : NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await setSessionCookie({
    userId: resolvedUser.id,
    username: resolvedUser.username,
    displayName: resolvedUser.displayName
  });

  if (wantsHtml) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: resolvedUser.id,
      username: resolvedUser.username,
      displayName: resolvedUser.displayName
    }
  });
}
