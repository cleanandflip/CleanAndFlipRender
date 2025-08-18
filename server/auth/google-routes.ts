// server/auth/google-routes.ts
import { Router } from "express";
import { randomB64Url, sha256b64url, googleAuthUrl, exchangeCodeForTokens, decodeIdToken } from "./google-helpers";
import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "../config/database";

export const googleAuth = Router();
const sql = neon(DATABASE_URL);

/** Step 1: redirect to Google with PKCE */
googleAuth.get("/auth/google/start", (req, res, next) => {
  try {
    const state = randomB64Url(16);
    const verifier = randomB64Url(32);
    const codeChallenge = sha256b64url(verifier);
    const nonce = randomB64Url(16);

    // store ephemeral data in session
    req.session.google = { state, verifier, nonce };
    const url = googleAuthUrl({ state, codeChallenge, nonce });
    res.redirect(url);
  } catch (e) { next(e); }
});

/** Step 2: callback */
googleAuth.get("/auth/google/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return res.status(400).send("missing code/state");
    const s = req.session.google;
    if (!s || s.state !== state) return res.status(400).send("state mismatch");

    const tokens = await exchangeCodeForTokens(code, s.verifier);
    const claims = decodeIdToken(tokens.id_token);
    
    // Validate audience 
    if (claims.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).send("aud mismatch");
    }
    
    if (claims.nonce && s.nonce && claims.nonce !== s.nonce) return res.status(400).send("nonce mismatch");
    if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") {
      return res.status(400).send("iss mismatch");
    }

    // Upsert/link user
    const email = (claims.email || "").toLowerCase();
    const sub = claims.sub;
    const picture = claims.picture || null;
    const verified = !!claims.email_verified;

    let userRow;
    try {
      // Check if user exists by email
      const existing = await sql`
        SELECT id, email, google_sub FROM users WHERE lower(email) = ${email} LIMIT 1
      `;

      if (existing.length) {
        const u = existing[0];
        if (!u.google_sub) {
          // Link existing email user with Google
          await sql`
            UPDATE users SET 
              google_sub=${sub}, 
              google_email=${email}, 
              google_email_verified=${verified}, 
              google_picture=${picture}, 
              last_login_at=NOW() 
            WHERE id=${u.id}
          `;
        } else {
          // Update login time for existing Google user
          await sql`UPDATE users SET last_login_at=NOW() WHERE id=${u.id}`;
        }
        const updatedUser = await sql`SELECT * FROM users WHERE id=${u.id}`;
        userRow = updatedUser[0];
      } else {
        // Create new user
        const newUser = await sql`
          INSERT INTO users (email, first_name, last_name, google_sub, google_email, google_email_verified, google_picture, last_login_at)
          VALUES (${email || null}, ${claims.name || 'Google'}, ${' User'}, ${sub}, ${email || null}, ${verified}, ${picture}, NOW()) 
          RETURNING *
        `;
        userRow = newUser[0];
      }
    } catch (e) {
      console.error("[GOOGLE AUTH] Database error:", e);
      throw e;
    }

    // Establish session
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.userId = userRow.id;
      req.session.email = userRow.email;
      console.log("[GOOGLE AUTH] Session established for user:", userRow.id);
      res.redirect("/"); // or to a post-login route
    });
  } catch (e) { 
    console.error("[GOOGLE AUTH] Callback error:", e);
    next(e); 
  }
});

/** Logout */
googleAuth.post("/auth/logout", (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie("cf.sid", { path: "/" });
    res.json({ ok: true });
  });
});