import crypto from "node:crypto";
import { cookies } from "next/headers";

import { ADMIN_COOKIE } from "@/lib/constants";
import { getServerEnv, hasServerEnv } from "@/lib/env";

const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function getAdminSessionSecret() {
  const env = getServerEnv();

  return crypto
    .createHash("sha256")
    .update(`${env.adminPassword}:${env.serviceRoleKey}`)
    .digest();
}

function signSessionPayload(payload: string) {
  return crypto.createHmac("sha256", getAdminSessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000
    })
  ).toString("base64url");

  return `${payload}.${signSessionPayload(payload)}`;
}

function verifyAdminSessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signSessionPayload(payload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated() {
  if (!hasServerEnv()) {
    return false;
  }

  const cookieStore = cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export { ADMIN_SESSION_MAX_AGE };
