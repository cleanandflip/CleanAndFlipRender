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
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // 1) Try store-native list (may ignore time window)
    let result = await SimpleErrorStore.listIssues?.({ q, level, env, resolved, page, limit, since });

    // 2) Fallback if no items OR store says total=0
    if (!result || !Array.isArray(result.items) || result.items.length === 0) {
      // Pull recent events (prefer since-based API if available)
      const recent =
        (await SimpleErrorStore.findEventsSince?.(since)) ??
        (await SimpleErrorStore.findEvents?.({ since })) ??
        [];

      // Group events -> issues
      const groups = new Map<string, any>();
      for (const evt of recent) {
        if (level && evt.level !== level) continue;
        if (env && evt.env !== env) continue;

        const fp =
          evt.fingerprint ??
          crypto.createHash("sha1")
            .update(
              [
                evt.message || "",
                Array.isArray(evt.stack) ? evt.stack[0] ?? "" : (evt.stack ?? ""),
                evt.service || "",
                evt.type || "",
              ].join("|")
            )
            .digest("hex");

        const g =
          groups.get(fp) ||
          {
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
        const ev = evt.env || "unknown";
        g.envs[ev] = (g.envs[ev] ?? 0) + 1;

        groups.set(fp, g);
      }

      let items = [...groups.values()];

      // text filter
      if (q) {
        const qq = q.toLowerCase();
        items = items.filter(
          (it) =>
            it.title?.toLowerCase().includes(qq) ||
            it.fingerprint?.toLowerCase().includes(qq)
        );
      }

      // status filter
      if (resolvedRaw !== undefined) {
        items = items.filter((it) =>
          resolved ? it.resolved === true : it.resolved !== true
        );
      }

      // sort & paginate
      items.sort(
        (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );
      const total = items.length;
      const start = (page - 1) * limit;
      result = { items: items.slice(start, start + limit), total, page, limit };
    }

    // Merge status flags for all items
    if (result && Array.isArray(result.items)) {
      await Promise.all(result.items.map(async (it: any) => {
        const st = await SimpleErrorStore.getIssueStatus(it.fingerprint);
        if (st) { 
          it.resolved = !!st.resolved; 
          it.ignored = !!st.ignored; 
        }
      }));
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
    const fp = req.params.fp;

    // Try store
    let issue = await SimpleErrorStore.getIssue?.(fp);

    // Fallback: derive from recent events for that fingerprint (last 30 days)
    if (!issue) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const evs =
        (await SimpleErrorStore.getIssueEvents?.(fp, 200)) ??
        ((await SimpleErrorStore.findEventsSince?.(since)) ?? [])
          .filter((e: any) => (e.fingerprint ?? "") === fp);

      if (Array.isArray(evs) && evs.length) {
        evs.sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.timestamp).getTime() -
            new Date(a.createdAt || a.timestamp).getTime()
        );
        issue = {
          fingerprint: fp,
          title: evs[0].message || "(no message)",
          level: evs[0].level || "error",
          firstSeen: evs[evs.length - 1].createdAt || evs[evs.length - 1].timestamp,
          lastSeen: evs[0].createdAt || evs[0].timestamp,
          count: evs.length,
          resolved: false,
          ignored: false,
          service: evs[0].service,
        };
      }
    }

    if (!issue) return res.status(404).json({ error: "Issue not found" });

    // Merge status flags
    const st = await SimpleErrorStore.getIssueStatus(fp);
    if (st && issue) { 
      issue.resolved = !!st.resolved; 
      issue.ignored = !!st.ignored; 
    }

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
  try { 
    await SimpleErrorStore.setResolved(req.params.fp, true); 
    res.json({ ok: true }); 
  } catch (e) { 
    console.error(e); 
    res.status(500).json({ error: "Failed to resolve" }); 
  }
});

router.put("/issues/:fp/reopen", async (req, res) => {
  try { 
    await SimpleErrorStore.setResolved(req.params.fp, false); 
    res.json({ ok: true }); 
  } catch (e) { 
    console.error(e); 
    res.status(500).json({ error: "Failed to reopen" }); 
  }
});

router.put("/issues/:fp/ignore", async (req, res) => {
  try { 
    await SimpleErrorStore.setIgnored(req.params.fp, true); 
    res.json({ ok: true }); 
  } catch (e) { 
    console.error(e); 
    res.status(500).json({ error: "Failed to ignore" }); 
  }
});

router.put("/issues/:fp/unignore", async (req, res) => {
  try { 
    await SimpleErrorStore.setIgnored(req.params.fp, false); 
    res.json({ ok: true }); 
  } catch (e) { 
    console.error(e); 
    res.status(500).json({ error: "Failed to unignore" }); 
  }
});

// 6) series for chart
router.get("/series", async (req, res) => {
  try {
    const days = Math.min(30, Math.max(1, parseInt(String(req.query.days ?? "1"), 10)));
    const rows = await SimpleErrorStore.getChartData?.(days);
    const normalized = Array.isArray(rows)
      ? rows.map((r: any) => ({ ts: r.ts || r.hour || r.time, count: r.count ?? r.value ?? 0 }))
      : [];
    res.json(normalized);
  } catch (e) {
    console.error("observability.series failed:", e);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

export default router;