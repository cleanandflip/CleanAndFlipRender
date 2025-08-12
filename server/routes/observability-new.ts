import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { ErrorStore } from "../data/errorStore";

const router = Router();

// Enhanced noise filtering patterns
const IGNORE_URL = [
  /:\/\/replit\.com\/public\/js\/beacon\.js$/,
];

const DOWNGRADE_TO_INFO = [
  /res\.cloudinary\.com\/clean-flip\/image\/upload\/.+\/categories\/.+\.(jpg|png|webp)$/i,
];

const IngestSchema = z.object({
  service: z.enum(["client", "server"]),
  level: z.enum(["error", "warn", "info"]).default("error"),
  env: z.enum(["development", "production"]).default(
    process.env.NODE_ENV === "production" ? "production" : "development"
  ),
  release: z.string().optional(),
  url: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  message: z.string().min(1),
  type: z.string().optional(),
  stack: z.string().optional(),
  user: z.object({ id: z.string().optional() }).optional(),
  tags: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  extra: z.record(z.string(), z.any()).optional(),
}).strict();

function normalizeStack(raw?: string): string[] {
  if (!raw) return [];
  return raw.split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.includes("node_modules") && !l.includes("(internal"))
    .map(l => l.replace(/\(\w+:\/\/.*?\)/g, "()").replace(/:\d+:\d+/g, ":__:__"));
}

function fingerprintOf(p: { message?: string; stack?: string[]; url?: string; type?: string; service: string }) {
  const top = p.stack?.[0] ?? "";
  const basis = [p.service, p.type ?? "", p.message ?? "", top, p.url ?? ""].join("|").slice(0, 2048);
  let h = 0; 
  for (let i = 0; i < basis.length; i++) {
    h = (h * 31 + basis.charCodeAt(i)) | 0;
  }
  return `fp_${Math.abs(h)}`;
}

// Issues listing with proper filtering
router.get("/issues", async (req, res) => {
  const Query = z.object({
    q: z.string().optional(),
    level: z.enum(["error","warn","info"]).optional(),
    env: z.enum(["production","development"]).optional(),
    resolved: z.coerce.boolean().optional(),
    ignored: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(["lastSeen","count","firstSeen"]).default("lastSeen"),
    sortOrder: z.enum(["asc","desc"]).default("desc"),
  });

  const q = Query.safeParse(req.query);
  if (!q.success) return res.status(400).json({ error: q.error.flatten() });

  const result = await ErrorStore.listIssues(q.data);
  res.json({
    ...result,
    items: result.items.map(i => ({
      ...i,
      firstSeen: new Date(i.firstSeen).toISOString(),
      lastSeen: new Date(i.lastSeen).toISOString(),
    })),
  });
});

// Individual issue details
router.get("/issues/:fp", async (req, res) => {
  const issue = await ErrorStore.getIssue(req.params.fp);
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  res.json({
    issue: {
      ...issue,
      firstSeen: new Date(issue.firstSeen).toISOString(),
      lastSeen: new Date(issue.lastSeen).toISOString(),
    }
  });
});

// Issue events/raw data
router.get("/issues/:fp/events", async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const rows = await ErrorStore.getRawForIssue(req.params.fp, limit);
  res.json(rows.map(r => ({ ...r, createdAt: new Date(r.createdAt).toISOString() })));
});

// Issue actions
router.put("/issues/:fp/resolve", async (req, res) => {
  await ErrorStore.setResolved(req.params.fp, true);
  const issue = await ErrorStore.getIssue(req.params.fp);
  res.json({ ok: true, issue: issue && {
    ...issue,
    firstSeen: new Date(issue.firstSeen).toISOString(),
    lastSeen: new Date(issue.lastSeen).toISOString(),
  }});
});

router.put("/issues/:fp/reopen", async (req, res) => {
  await ErrorStore.setResolved(req.params.fp, false);
  const issue = await ErrorStore.getIssue(req.params.fp);
  res.json({ ok: true, issue: issue && {
    ...issue,
    firstSeen: new Date(issue.firstSeen).toISOString(),
    lastSeen: new Date(issue.lastSeen).toISOString(),
  }});
});

router.put("/issues/:fp/ignore", async (req, res) => {
  await ErrorStore.setIgnored(req.params.fp, true);
  res.json({ ok: true });
});

router.put("/issues/:fp/unignore", async (req, res) => {
  await ErrorStore.setIgnored(req.params.fp, false);
  res.json({ ok: true });
});

// Chart/series data
router.get("/series", async (req, res) => {
  const days = Math.min(Number(req.query.days ?? 1), 30);
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 3600 * 1000);
  const rows = await ErrorStore.chartByHour({ from, to: now });
  res.json(rows.map(r => ({ ...r, hour: new Date(r.hour).toISOString() })));
});

// Enhanced ingest with comprehensive noise filtering
router.post("/errors", async (req, res) => {
  const parsed = IngestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const now = new Date();
  const stack = normalizeStack(parsed.data.stack);
  let level = parsed.data.level;

  // Apply noise filtering rules
  const msg = parsed.data.message ?? "";
  const urlMatch = /https?:\/\/[^\s]+/i.exec(msg)?.[0] ?? parsed.data.url ?? "";

  if (urlMatch && IGNORE_URL.some(rx => rx.test(urlMatch))) {
    return res.status(204).end(); // Silently ignore
  }
  if (urlMatch && DOWNGRADE_TO_INFO.some(rx => rx.test(urlMatch))) {
    level = "info";
  }

  // Boundary errors bypass noise filters
  const fromBoundary = parsed.data.extra && parsed.data.extra.source === "boundary";
  if (level === "error" && !fromBoundary && stack.length === 0) {
    level = "warn";
  }

  const base = { ...parsed.data, level, stack };
  const fingerprint = fingerprintOf({ ...base, stack });

  const raw = {
    eventId: randomUUID(),
    createdAt: now,
    ...base,
    fingerprint,
  };

  await ErrorStore.insertRaw(raw);

  // Skip rollup if issue is ignored
  const existing = await ErrorStore.getIssue(fingerprint);
  if (existing?.ignored) {
    return res.status(201).json({ ok: true, eventId: raw.eventId, fingerprint, ignored: true });
  }

  await Promise.all([
    ErrorStore.upsertIssue(raw),
    ErrorStore.bumpRollup(raw),
  ]);

  res.status(201).json({ ok: true, eventId: raw.eventId, fingerprint });
});

export default router;