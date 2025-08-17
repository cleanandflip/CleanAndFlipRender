export function reportClientError(err: unknown) {
  // DISABLED: Error reporting completely disabled to stop validation loop
  return;
  
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  fetch("/api/errors/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      message,
      stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: "error",
      timestamp: new Date().toISOString(),
      metadata: {
        name: err instanceof Error ? err.name : "Error",
        clientSide: true
      }
    }),
  }).catch(() => {
    // Silently ignore fetch failures to prevent infinite loops
  });
}

// DISABLED: Global error handlers completely disabled
export function installGlobalErrorHandlers() {
  // Error handling disabled to stop reporting loop
  return;
}