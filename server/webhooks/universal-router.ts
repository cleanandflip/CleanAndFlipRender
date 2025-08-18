import { Router } from "express";
import crypto from "node:crypto";
import { json, raw } from "express";
import { WEBHOOK_PREFIX, WEBHOOKS } from "../config/universal-env";

/**
 * Mounts webhooks at:
 *   /wh/dev/stripe
 *   /wh/prod/stripe
 *   /wh/dev/generic
 *   /wh/prod/generic
 *
 * Each provider verifies the signature using its env-specific secret.
 * Add your providers below (or adapt Stripe to use official SDK if preferred).
 */
export function mountUniversalWebhooks(app: import("express").Express) {
  const r = Router();

  // Stripe (uses their "t=...,v1=..." header; lightweight verifier)
  r.post("/stripe", raw({ type: "*/*" }), (req, res) => {
    const secret = WEBHOOKS.stripe.secret;
    const sig = String(req.headers["stripe-signature"] || "");
    const timestamp = sig.match(/t=([^,]+)/)?.[1];
    const v1 = sig.match(/v1=([^,]+)/)?.[1];
    if (!timestamp || !v1) return res.status(400).send("Bad Stripe signature");

    const payload = `${timestamp}.${req.body.toString("utf8")}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (!timingSafeEqual(v1, expected)) return res.status(400).send("Invalid Stripe signature");
    
    // TODO: handle event safely
    console.log(`✅ Universal Webhook: Stripe event received via ${WEBHOOK_PREFIX}/stripe`);
    res.json({ ok: true });
  });

  // Generic HMAC provider (x-signature: hex(hmac_sha256(body)))
  r.post("/generic", raw({ type: "*/*" }), (req, res) => {
    const secret = WEBHOOKS.generic.secret;
    const header = String(req.headers[WEBHOOKS.generic.signatureHeader] || "");
    const expected = crypto.createHmac("sha256", secret).update(req.body as Buffer).digest("hex");
    if (!timingSafeEqual(header, expected)) return res.status(400).send("Invalid signature");
    
    // TODO: handle event safely
    console.log(`✅ Universal Webhook: Generic event received via ${WEBHOOK_PREFIX}/generic`);
    res.json({ ok: true });
  });

  app.use(WEBHOOK_PREFIX, r);           // env-scoped prefix
  app.use(json());                      // return to normal parsers
  
  console.log(`🔗 Universal Webhooks mounted at ${WEBHOOK_PREFIX}/*`);
}

function timingSafeEqual(a: string, b: string) {
  const A = Buffer.from(a); 
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}