// src/server/routes/observability.ts
import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import crypto from "crypto";
import { SimpleErrorStore } from "../data/simpleErrorStore";

const now = () => new Date();
const sinceDays = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

function fingerprintFromEvent(evt: any) {
  const base = [
    evt.message || "",
    (Array.isArray(evt.stack) ? evt.stack[0] : evt.stack) || "",
    evt.service || "",
    evt.type || "",
  ].join("|");
  return crypto.createHash("sha1").update(base).digest("hex");
}

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
    const resolvedRaw = req.query.resolved;
    const resolved =
      resolvedRaw === undefined ? undefined : String(resolvedRaw) === "true";
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
    const days = Math.min(30, Math.max(1, parseInt(String(req.query.days ?? "1"), 10)));
    const since = sinceDays(days);
    const until = now();

    // Use the standard listIssues API with fallback aggregation
    let result = await SimpleErrorStore.listIssues({ page, limit });

    // If we have no issues but need time-scoped data, create from events
    if (!result.items || result.items.length === 0) {
      const recent = await SimpleErrorStore.findEventsSince(since);
      const events: any[] = Array.isArray(recent) ? recent : [];
      const groups = new Map<string, any>();

      for (const evt of events) {
        // basic filters first
        if (level && evt.level !== level) continue;
        if (env && evt.env !== env) continue;
        // resolved filter can't be known from raw events; we keep everything for 'all' and 'unresolved' modes
        const fp = evt.fingerprint || fingerprintFromEvent(evt);
        const g = groups.get(fp) || {
          fingerprint: fp,
          title: evt.message || "(no message)",
          level: evt.level || "error",
          firstSeen: evt.createdAt || evt.timestamp || new Date().toISOString(),
          lastSeen: evt.createdAt || evt.timestamp || new Date().toISOString(),
          count: 0,
          resolved: false,
          ignored: false,
          service: evt.service,
          envs: {},
        };
        g.count += 1;
        g.lastSeen = evt.createdAt || evt.timestamp || g.lastSeen;
        g.envs[evt.env || "unknown"] = (g.envs[evt.env || "unknown"] ?? 0) + 1;
        groups.set(fp, g);
      }

      let items = [...groups.values()];

      // text search
      if (q) {
        const QQ = q.toLowerCase();
        items = items.filter((it) =>
          it.title?.toLowerCase().includes(QQ) ||
          it.fingerprint.includes(QQ)
        );
      }

      // status filter (only apply "resolved" true if explicitly requested)
      const statusParam = resolvedRaw === undefined ? "all" : resolved ? "resolved" : "unresolved";
      if (statusParam === "resolved") items = items.filter((it) => it.resolved);
      if (statusParam === "unresolved") items = items.filter((it) => !it.resolved);

      // sort by lastSeen desc
      items.sort((a, b) => (new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()));

      const total = items.length;
      const start = (page - 1) * limit;
      result = { items: items.slice(start, start + limit), total, page, limit };
    }

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
    const events = await SimpleErrorStore.getRawForIssue(req.params.fp, limit);
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

    // Normalize shape to { ts, count }
    const normalized = Array.isArray(rows) ? rows.map((r: any) => ({
      ts: r.ts || r.hour || r.time || r.bucket,
      count: r.count ?? r.value ?? r.total ?? 0,
    })) : [];

    res.json(normalized);
  } catch (e) {
    console.error("observability.series failed:", e);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

export default router;