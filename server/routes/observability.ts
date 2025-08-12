// src/server/routes/observability.ts
import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { SimpleErrorStore } from "../data/simpleErrorStore";

const router = Router();

/** scrub stack frames for grouping */
function normalizeStack(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.includes("node_modules") && !l.includes("(internal"))
    .map((l) => l.replace(/\(\w+:\/\/.*?\)/g, "()").replace(/:\d+:\d+/g, ":__:__"));
}

const IngestSchema = z.object({
  service: z.enum(["client", "server"]).default("client"),
  level: z.enum(["error", "warn", "info"]).default("error"),
  env: z.enum(["production", "development"]).default(
    process.env.NODE_ENV === "production" ? "production" : "development"
  ),
  release: z.string().optional(),
  url: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.coerce.number().optional(),
  message: z.string().min(1),
  type: z.string().optional(),
  stack: z.string().optional(),
  extra: z.record(z.any()).optional(),
});

// 1) ingest events
router.post("/errors", async (req, res) => {
  try {
    const parsed = IngestSchema.parse(req.body ?? {});
    const event = {
      eventId: randomUUID(),
      createdAt: new Date().toISOString(),
      ...parsed,
      stack: normalizeStack(parsed.stack).join('\n'),
    };
    await SimpleErrorStore.addError(event);
    res.status(202).json({ ok: true, eventId: event.eventId });
  } catch (e) {
    console.error("observability.ingest failed:", e);
    res.status(400).json({ error: "Invalid payload" });
  }
});

// 2) list issues (filters + paging)
router.get("/issues", async (req, res) => {
  try {
    const q = String(req.query.q ?? "");
    const level = String(req.query.level ?? "");
    const env = String(req.query.env ?? "");
    const resolved = String(req.query.resolved ?? "false") === "true";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));

    const result = await SimpleErrorStore.listIssues({ page, limit });
    res.json(result);
  } catch (e) {
    console.error("observability.listIssues failed:", e);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

// 3) issue details
router.get("/issues/:fp", async (req, res) => {
  try {
    const issue = await SimpleErrorStore.getIssue(req.params.fp);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json({ issue });
  } catch (e) {
    console.error("observability.issue failed:", e);
    res.status(500).json({ error: "Failed to fetch issue" });
  }
});

// 4) events for an issue
router.get("/issues/:fp/events", async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10)));
    const events = await SimpleErrorStore.getEvents(req.params.fp, limit);
    res.json(events || []);
  } catch (e) {
    console.error("observability.issueEvents failed:", e);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// 5) actions
router.put("/issues/:fp/resolve", async (req, res) => {
  try { await SimpleErrorStore.markResolved(req.params.fp, true); res.json({ ok: true }); }
  catch (e) { console.error("observability.resolve failed:", e); res.status(500).json({ error: "Failed to resolve issue" }); }
});
router.put("/issues/:fp/reopen", async (req, res) => {
  try { await SimpleErrorStore.markResolved(req.params.fp, false); res.json({ ok: true }); }
  catch (e) { console.error("observability.reopen failed:", e); res.status(500).json({ error: "Failed to reopen issue" }); }
});
router.put("/issues/:fp/ignore", async (req, res) => {
  try { await SimpleErrorStore.markIgnored(req.params.fp, true); res.json({ ok: true }); }
  catch (e) { console.error("observability.ignore failed:", e); res.status(500).json({ error: "Failed to ignore issue" }); }
});
router.put("/issues/:fp/unignore", async (req, res) => {
  try { await SimpleErrorStore.markIgnored(req.params.fp, false); res.json({ ok: true }); }
  catch (e) { console.error("observability.unignore failed:", e); res.status(500).json({ error: "Failed to unignore issue" }); }
});

// 6) series for chart
router.get("/series", async (req, res) => {
  try {
    const days = Math.min(30, Math.max(1, parseInt(String(req.query.days ?? "1"), 10)));
    const rows = await SimpleErrorStore.getChartData(days);
    res.json(rows);
  } catch (e) {
    console.error("observability.series failed:", e);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

export default router;