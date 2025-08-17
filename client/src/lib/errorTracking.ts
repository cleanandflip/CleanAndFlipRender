export function reportClientError(err: unknown) {
  // Temporarily disable error reporting to fix the validation loop
  return;
  
  // Skip error reporting in dev mode and headless browsers to reduce spam
  if (import.meta.env.DEV) return;
  if (navigator.userAgent.includes('HeadlessChrome')) return;
  
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

// Placeholder function to maintain compatibility
export function installGlobalErrorHandlers() {
  // Global error handler for unhandled exceptions
  window.addEventListener('error', (event) => {
    reportClientError(event.error || new Error(event.message));
  });

  // Global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportClientError(event.reason || new Error('Unhandled Promise Rejection'));
  });
}