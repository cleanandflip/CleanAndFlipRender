import { Router } from "express";
import { z } from "zod";
import { ErrorStore } from "../data/errorStore";
import crypto from "crypto";

// Generate UUID without external dependency
function generateUUID() {
  return crypto.randomUUID();
}

const router = Router();

const Ingest = z.object({
  service: z.enum(["client", "server"]).default("client"),
  level: z.enum(["error", "warn", "info"]).default("error"),
  env: z.enum(["production", "development"]).default(
    process.env.NODE_ENV === "production" ? "production" : "development"
  ),
  release: z.string().optional(),
  url: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.coerce.number().optional(),
  message: z.string().optional(),
  type: z.string().optional(),
  stack: z.string().optional(),
  user: z.object({ id: z.string().optional() }).optional(),
  tags: z.record(z.string(), z.any()).optional(),
  extra: z.record(z.string(), z.any()).optional(),
}).strip();

function normalizeStack(raw?: string): string {
  if (!raw) return "";
  return raw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !/node_modules|\(internal/.test(l))
    .map(l => l.replace(/:\d+:\d+/g, ":__:__"))
    .join("\n");
}

function fingerprintOf(p: { service: string; type?: string; message?: string; stack?: string; url?: string }) {
  const top = p.stack?.split("\n")[0] ?? "";
  const basis = [p.service, p.type ?? "", (p.message ?? "").slice(0, 180), top, p.url ?? ""].join("|");
  let h = 0;
  for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) | 0;
  return `fp_${Math.abs(h)}`;
}

// Ingest errors
router.post("/errors", async (req, res) => {
  try {
    const parsed = Ingest.safeParse(req.body);
    if (!parsed.success) {
      return res.status(200).json({ ok: true, ignored: true }); // don't spam 400s
    }

    let d = parsed.data;
    
    // Noise control
    const isBeacon = d.url?.endsWith("/public/js/beacon.js");
    const isCategoryImg = /res\.cloudinary\.com\/clean-flip\/image\/upload\/.*\/categories\//i.test(d.message ?? "") ||
                          /res\.cloudinary\.com\/clean-flip\/image\/upload\/.*\/categories\//i.test(d.url ?? "");
    
    if (isBeacon) return res.status(204).end();
    if (isCategoryImg && d.level === "error") d.level = "info";

    const now = new Date();
    const stack = normalizeStack(d.stack);
    const fingerprint = fingerprintOf({ 
      service: d.service, 
      type: d.type, 
      message: d.message, 
      stack, 
      url: d.url 
    });

    const raw = {
      event_id: generateUUID(),
      created_at: now,
      service: d.service,
      level: d.level,
      env: d.env,
      release: d.release,
      url: d.url,
      method: d.method,
      status_code: d.statusCode,
      message: d.message ?? d.type ?? "Error",
      type: d.type,
      stack,
      user_id: d.user?.id,
      tags: d.tags ?? {},
      extra: d.extra ?? {},
      fingerprint
    };

    await ErrorStore.insertRaw(raw);
    const issue = await ErrorStore.upsertIssue(raw);
    await ErrorStore.bumpRollup(raw);

    return res.status(201).json({ ok: true, fingerprint, eventId: raw.event_id });
  } catch (error) {
    console.error("Error ingesting observability event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// List issues with filtering
router.get("/issues", async (req, res) => {
  try {
    const result = await ErrorStore.listIssues({
      q: req.query.q as string,
      level: req.query.level as string,
      env: req.query.env as string,
      resolved: req.query.resolved === "true",
      ignored: req.query.ignored === "true",
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as string,
    });

    res.json(result);
  } catch (error) {
    console.error("Failed to list issues:", error);
    res.status(500).json({ error: "Failed to list issues" });
  }
});

// Get single issue
router.get("/issue/:fingerprint", async (req, res) => {
  try {
    const issue = await ErrorStore.getIssue(req.params.fingerprint);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }
    res.json({ issue });
  } catch (error) {
    console.error("Failed to get issue:", error);
    res.status(500).json({ error: "Failed to get issue" });
  }
});

// Get issue events
router.get("/events/:fingerprint", async (req, res) => {
  try {
    const events = await ErrorStore.getEvents(req.params.fingerprint);
    res.json(events);
  } catch (error) {
    console.error("Failed to get events:", error);
    res.status(500).json({ error: "Failed to get events" });
  }
});

// Chart data (time series)
router.get("/series", async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days ?? 1), 30);
    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const rows = await ErrorStore.chartByHour({ from, to: now });

    const data = rows
      .filter(r => r.hour) // guard against null hours
      .map(r => {
        try {
          return { 
            hour: new Date(r.hour as any).toISOString(), 
            count: Number(r.count) || 0 
          };
        } catch {
          return null; // skip invalid dates
        }
      })
      .filter(Boolean); // remove nulls

    res.json(data);
  } catch (error) {
    console.error("Failed to get chart data:", error);
    res.json([]); // return empty array instead of error
  }
});

// Issue actions
router.post("/resolve/:fingerprint", async (req, res) => {
  try {
    await ErrorStore.resolve(req.params.fingerprint);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to resolve issue:", error);
    res.status(500).json({ error: "Failed to resolve issue" });
  }
});

router.post("/reopen/:fingerprint", async (req, res) => {
  try {
    await ErrorStore.reopen(req.params.fingerprint);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to reopen issue:", error);
    res.status(500).json({ error: "Failed to reopen issue" });
  }
});

router.post("/ignore/:fingerprint", async (req, res) => {
  try {
    await ErrorStore.ignore(req.params.fingerprint);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to ignore issue:", error);
    res.status(500).json({ error: "Failed to ignore issue" });
  }
});

router.post("/unignore/:fingerprint", async (req, res) => {
  try {
    await ErrorStore.unignore(req.params.fingerprint);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to unignore issue:", error);
    res.status(500).json({ error: "Failed to unignore issue" });
  }
});

export default router;