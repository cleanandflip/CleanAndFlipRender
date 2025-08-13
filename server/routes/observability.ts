import { Router } from "express";
import { z } from "zod";

const router = Router();

const ErrorEvent = z.object({
  name: z.string().optional().default("Error"),
  message: z.string().min(1),
  stack: z.string().optional(),
  url: z.string().url().optional(),
  userId: z.string().uuid().optional(),
  meta: z.record(z.any()).optional(),
});

router.post("/api/observability/errors", async (req, res) => {
  const parse = ErrorEvent.safeParse(req.body);
  if (!parse.success) {
    // Don't 400 spam the logs; accept and downgrade
    return res.status(202).json({ 
      accepted: false, 
      reason: "invalid-payload", 
      issues: parse.error.issues 
    });
  }

  const ev = parse.data;
  // Persist to console in dev, could be DB in prod
  if (process.env.NODE_ENV !== "production") {
    console.warn("[client-error]", ev.name, ev.message, { url: ev.url });
  }
  
  return res.status(202).json({ accepted: true });
});

export default router;