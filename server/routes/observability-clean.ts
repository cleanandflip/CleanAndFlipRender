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

export default router;