import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

type LoginBody = {
  username?: string;
  passcode?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;

  if (!body?.username || !body?.passcode) {
    return NextResponse.json({ error: "Username and passcode are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: {
      username: body.username
    }
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const matches = await bcrypt.compare(body.passcode, user.passcodeHash);

  if (!matches) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  await setSessionCookie({
    userId: user.id,
    username: user.username,
    displayName: user.displayName
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName
    }
  });
}
