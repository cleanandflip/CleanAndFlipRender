// Tolerant dev handler for observability from punch list
import express from 'express';

const router = express.Router();

// Accept error reports or disable in dev (from punch list)
router.post('/errors', (req, res) => {
  // Simply accept and ignore in development to stop spam
  res.sendStatus(204);
});

export default router;