export function reportClientError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  fetch("/api/observability/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      name: err instanceof Error ? err.name : "Error",
      message,
      stack,
      url: window.location.href,
      meta: { ua: navigator.userAgent },
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