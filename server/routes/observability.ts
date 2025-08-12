import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { SimpleErrorStore } from "../data/simpleErrorStore";

const router = Router();

// Normalize/strip noise from stacks for grouping
function normalizeStack(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.includes("node_modules") && !l.includes("(internal"))
    .map(l => l.replace(/\(\w+:\/\/.*?\)/g, "()").replace(/:\d+:\d+/g, ":__:__"));
}

// Fingerprint = hash(message + top frame + url + type)
function fingerprintOf(p: { message?: string; stack?: string[]; url?: string; type?: string; service: string }) {
  const top = p.stack?.[0] ?? "";
  const basis = [p.service, p.type ?? "", p.message ?? "", top, p.url ?? ""].join("|").slice(0, 2048);
  // Trivial deterministic hash
  let h = 0; 
  for (let i = 0; i < basis.length; i++) {
    h = (h * 31 + basis.charCodeAt(i)) | 0;
  }
  return `${p.service}:${Math.abs(h)}`;
}

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

// Error ingestion endpoint
router.post("/errors", async (req, res) => {
  try {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const now = new Date();
    const stack = normalizeStack(parsed.data.stack);
    const fingerprint = fingerprintOf({ ...parsed.data, stack });

    const raw = {
      eventId: randomUUID(),
      createdAt: now,
      ...parsed.data,
      stack,
      fingerprint,
      userId: parsed.data.user?.id,
    };

    const result = await SimpleErrorStore.addError({
      service: parsed.data.service,
      level: parsed.data.level,
      message: parsed.data.message,
      stack: parsed.data.stack,
      url: parsed.data.url,
      env: parsed.data.env,
    });

    res.status(201).json({ ok: true, eventId: result.eventId, fingerprint: result.fingerprint });
  } catch (error) {
    console.error("Error ingestion failed:", error);
    res.status(500).json({ error: "Failed to process error" });
  }
});

// Admin API - List issues
router.get("/issues", async (req, res) => {
  try {
    const q = String(req.query.q ?? "");
    const level = req.query.level as any;
    const env = req.query.env as any;
    const resolved = req.query.resolved !== undefined ? req.query.resolved === "true" : undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);

    const result = await SimpleErrorStore.listIssues({ page, limit });
    res.json(result);
  } catch (error) {
    console.error("Failed to list issues:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

// Admin API - Get specific issue
router.get("/issues/:fp", async (req, res) => {
  try {
    const [issue, events] = await Promise.all([
      SimpleErrorStore.getIssue(req.params.fp),
      SimpleErrorStore.getRawForIssue(req.params.fp, 50),
    ]);
    
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    res.json({ issue, events });
  } catch (error) {
    console.error("Failed to fetch issue:", error);
    res.status(500).json({ error: "Failed to fetch issue details" });
  }
});

// Admin API - Resolve issue
router.put("/issues/:fp/resolve", async (req, res) => {
  try {
    await SimpleErrorStore.setResolved(req.params.fp, true);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to resolve issue:", error);
    res.status(500).json({ error: "Failed to resolve issue" });
  }
});

// Admin API - Reopen issue
router.put("/issues/:fp/reopen", async (req, res) => {
  try {
    await SimpleErrorStore.setResolved(req.params.fp, false);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to reopen issue:", error);
    res.status(500).json({ error: "Failed to reopen issue" });
  }
});

// Admin API - Ignore issue
router.put("/issues/:fp/ignore", async (req, res) => {
  try {
    await SimpleErrorStore.setIgnored(req.params.fp, true);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to ignore issue:", error);
    res.status(500).json({ error: "Failed to ignore issue" });
  }
});

// Admin API - Unignore issue
router.put("/issues/:fp/unignore", async (req, res) => {
  try {
    await SimpleErrorStore.setIgnored(req.params.fp, false);
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to unignore issue:", error);
    res.status(500).json({ error: "Failed to unignore issue" });
  }
});



// Admin API - Chart data
router.get("/series", async (req, res) => {
  try {
    const now = new Date();
    const days = Number(req.query.days ?? 1);
    const from = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const env = req.query.env as string;
    
    const rows = await SimpleErrorStore.getChartData(days);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

export default router;