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
const decoder = new TextDecoder();

function getSessionSecret() {
  return process.env.SESSION_SECRET || "development-secret-change-me";
}

function bytesToBase64(input: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input).toString("base64");
  }

  let binary = "";
  for (const byte of input) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(input: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(input, "base64"));
  }

  const binary = atob(input);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function toBase64UrlBytes(input: Uint8Array) {
  return bytesToBase64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlToBytes(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return base64ToBytes(normalized);
}

function toBase64UrlString(input: string) {
  return toBase64UrlBytes(encoder.encode(input));
}

function fromBase64UrlToString(input: string) {
  return decoder.decode(fromBase64UrlToBytes(input));
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
  return toBase64UrlBytes(new Uint8Array(signature));
}

export async function createSessionToken(input: SessionInput) {
  const payload: SessionPayload = {
    ...input,
    exp: Date.now() + SESSION_MAX_AGE * 1000
  };
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64UrlString(serialized);
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
    const parsed = JSON.parse(fromBase64UrlToString(payloadPart)) as SessionPayload;

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
