// Throttled activity tracking to prevent spam
let lastTrackTime = 0;

export function trackActivity(event: string) {
  const now = Date.now();
  if (now - lastTrackTime < 15000) return; // Only track once per 15 seconds
  lastTrackTime = now;

  const payload = { event, timestamp: new Date().toISOString() };

  // Use sendBeacon if available for better performance, fallback to fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track-activity', JSON.stringify(payload));
  } else {
    fetch('/api/track-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {
      // Silently ignore failures to prevent error spam
    });
  }
}