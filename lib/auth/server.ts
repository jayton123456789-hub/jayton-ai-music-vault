import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  verifySessionToken
} from "@/lib/auth/session";

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

export async function setSessionCookie(input: {
  userId: number;
  username: string;
  displayName: string;
}) {
  const token = await createSessionToken(input);

  cookies().set(SESSION_COOKIE, token, getSessionCookieOptions());
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0
  });
}
