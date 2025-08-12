type Level = "error"|"warn"|"info";

export function reportClientError(e: { 
  message: string; 
  stack?: string; 
  level?: Level; 
  tags?: Record<string,string>; 
  extra?: Record<string,any>; 
  resource?: any; 
  test?: boolean 
}) {
  const payload = {
    message: e.message || "Unknown error",
    stack: e.stack,
    level: e.level ?? "error",
    env: import.meta.env.MODE || "development",
    url: location.href,
    userAgent: navigator.userAgent,
    tags: e.tags,
    extra: e.extra,
    resource: e.resource,
    timestamp: Date.now(),
    test: e.test,
  };

  // Try beacon first, fall back to fetch
  const ok = "sendBeacon" in navigator && navigator.sendBeacon(
    "/api/observability/errors",
    new Blob([JSON.stringify(payload)], { type: "application/json" })
  );
  
  if (!ok) {
    fetch("/api/observability/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(()=>{/* swallow */});
  }
}

export function installGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Expose for testing
    (window as any).reportClientError = reportClientError;
    
    // Auto-capture unhandled errors
    window.addEventListener('error', (event) => {
      reportClientError({
        message: event.message || 'Script error',
        stack: event.error?.stack,
        level: 'error',
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
    });

    // Auto-capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      reportClientError({
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
        level: 'error',
        extra: {
          reason: event.reason,
        }
      });
    });
  }
}

// Initialize automatically
installGlobalErrorHandlers();