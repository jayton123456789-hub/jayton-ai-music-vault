export const SESSION_COOKIE = "vault_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: number;
  username: string;
  displayName: string;
  exp: number;
};

type SessionInput = Omit<SessionPayload, "exp">;

const encoder = new TextEncoder();

function getSessionSecret() {
  return process.env.SESSION_SECRET || "development-secret-change-me";
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);

  return Buffer.from(normalized, "base64").toString("utf8");
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function signValue(value: string) {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const bytes = Array.from(new Uint8Array(signature))
    .map((byte) => String.fromCharCode(byte))
    .join("");

  return toBase64Url(bytes);
}

export async function createSessionToken(input: SessionInput) {
  const payload: SessionPayload = {
    ...input,
    exp: Date.now() + SESSION_MAX_AGE * 1000
  };
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serialized);
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = await signValue(payloadPart);

  if (signaturePart !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload;

    if (parsed.exp <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}
