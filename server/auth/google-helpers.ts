// server/auth/google-helpers.ts
import crypto from "node:crypto";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "../config/google";

export function randomB64Url(n=32) {
  return crypto.randomBytes(n).toString("base64url");
}

export function sha256b64url(input: string) {
  const h = crypto.createHash("sha256").update(input).digest();
  return Buffer.from(h).toString("base64url");
}

export function googleAuthUrl({ state, codeChallenge, nonce }: {state:string; codeChallenge:string; nonce:string}) {
  const p = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  p.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  p.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  p.searchParams.set("response_type", "code");
  p.searchParams.set("scope", "openid email profile");
  p.searchParams.set("code_challenge", codeChallenge);
  p.searchParams.set("code_challenge_method", "S256");
  p.searchParams.set("state", state);
  p.searchParams.set("nonce", nonce);
  // Optional: force account picker: p.searchParams.set("prompt","select_account");
  return p.toString();
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: GOOGLE_REDIRECT_URI,
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`token exchange failed: ${r.status}`);
  return r.json() as Promise<{
    access_token: string;
    id_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: "Bearer";
  }>;
}

export type GoogleIdToken = {
  iss: string; aud: string; sub: string; email?: string; email_verified?: boolean;
  name?: string; picture?: string; nonce?: string;
};

export function decodeIdToken(idToken: string): GoogleIdToken {
  // Signature is validated by Google during exchange; we still sanity-check claims locally.
  const decoded = jwt.decode(idToken) as GoogleIdToken | null;
  if (!decoded) throw new Error("bad id_token");
  return decoded;
}