import { Router } from "express";
import { z } from "zod";
import { SimpleErrorStore } from "../data/simpleErrorStore";

const router = Router();

const IngestSchema = z.object({
  service: z.enum(["client", "server"]),
  level: z.enum(["error", "warn", "info"]).default("error"),
  env: z.enum(["development", "production"]).default("development"),
  url: z.string().optional(),
  method: z.string().optional(),
  message: z.string().min(1),
  stack: z.string().optional(),
});

// Error ingestion endpoint
router.post("/errors", async (req, res) => {
  try {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const result = await SimpleErrorStore.addError(parsed.data);
    res.status(201).json({ ok: true, eventId: result.eventId, fingerprint: result.fingerprint });
  } catch (error) {
    console.error("Error ingestion failed:", error);
    res.status(500).json({ error: "Failed to process error" });
  }
});

// Admin API - List issues
router.get("/issues", async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const result = await SimpleErrorStore.listIssues({ page, limit });
    res.json(result);
  } catch (error) {
    console.error("Failed to list issues:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

// Admin API - Get specific issue details  
router.get("/issues/:fp", async (req, res) => {
  try {
    // For now, return mock issue details since we don't have full implementation
    const fingerprint = req.params.fp;
    const result = await SimpleErrorStore.listIssues({ page: 1, limit: 1 });
    const issue = result.items.find((i: any) => i.fingerprint === fingerprint);
    
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }
    
    res.json({ 
      issue,
      events: [] // Empty for now
    });
  } catch (error) {
    console.error("Failed to fetch issue:", error);
    res.status(500).json({ error: "Failed to fetch issue" });
  }
});

// Admin API - Chart data
router.get("/series", async (req, res) => {
  try {
    const days = Number(req.query.days ?? 1);
    const result = await SimpleErrorStore.getChartData(days);
    res.json(result);
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Admin API - Resolve issue
router.post("/issues/:fp/resolve", async (req, res) => {
  try {
    // For now, just return success
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to resolve issue:", error);
    res.status(500).json({ error: "Failed to resolve issue" });
  }
});

export default router;