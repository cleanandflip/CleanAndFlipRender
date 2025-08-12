import { Router } from "express";

const router = Router();

// Make track-activity fire-and-forget to prevent slow requests
router.post("/track-activity", (req, res) => {
  res.status(202).json({ ok: true }); // respond immediately
  
  setImmediate(async () => {
    try {
      // In the future, this could persist to database or queue
      // For now, just silently accept the activity data
    } catch (e) {
      console.error("track-activity persist failed", e);
    }
  });
});

export { router as trackActivityRouter };