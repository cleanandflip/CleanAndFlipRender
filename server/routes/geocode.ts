import { Router } from "express";
import { requireAuth } from "../auth";
import { Logger } from "../utils/logger";

const router = Router();

// Rate limiting for geocoding requests
const rateLimiter = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 60;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  rateLimiter.set(userId, [...recentRequests, now]);
  return true;
}

// Backend proxy for MapTiler API (secure approach)
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.ip || 'anonymous'; // Use IP for rate limiting for non-auth users

    if (!query || typeof query !== 'string' || query.length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }

    // Rate limiting check
    if (!checkRateLimit(userId)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    }

    const API_KEY = process.env.MAPTILER_API_KEY;
    if (!API_KEY) {
      Logger.error('MapTiler API key not configured');
      return res.status(500).json({ error: 'Geocoding service unavailable' });
    }

    // Proxy request to MapTiler
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${API_KEY}&country=US&limit=5&types=address`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      Logger.error(`MapTiler API error: ${response.status}`);
      return res.status(500).json({ error: 'Address search failed' });
    }

    const data = await response.json();
    
    Logger.info(`Geocoding request: ${query} - Results: ${data.features?.length || 0}`);
    
    res.json(data);

  } catch (error) {
    Logger.error('Geocoding proxy error:', error);
    res.status(500).json({ error: 'Address search failed' });
  }
});

export default router;