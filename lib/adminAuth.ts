import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_SESSION_VALUE = "admin";
const SIGNATURE_SEPARATOR = ".";

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }

  return secret;
}

function createSignature(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function createAdminSessionToken() {
  const signature = createSignature(ADMIN_SESSION_VALUE);

  return `${ADMIN_SESSION_VALUE}${SIGNATURE_SEPARATOR}${signature}`;
}

export function verifyAdminSessionToken(
  token: string | undefined
): boolean {
  if (!token) {
    return false;
  }

  const separatorIndex = token.indexOf(SIGNATURE_SEPARATOR);

  if (separatorIndex === -1) {
    return false;
  }

  const value = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (value !== ADMIN_SESSION_VALUE || !signature) {
    return false;
  }

  const expectedSignature = createSignature(value);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}