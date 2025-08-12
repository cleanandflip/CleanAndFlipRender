// Local Sentry-style error tracking system

declare global {
  interface Window {
    __USER?: { id?: string };
  }
}

const IGNORE_URL_PATTERNS = [
  /:\/\/replit\.com\/public\/js\/beacon\.js$/,
];

const DOWNGRADE_TO_INFO = [
  // Cloudinary category images
  /res\.cloudinary\.com\/clean-flip\/image\/upload\/.+\/categories\/.+\.(jpg|png|webp)$/i,
];

const seenThisSession = new Set<string>();

export function reportClientError(payload: {
  level?: "error" | "warn" | "info";
  message: string;
  type?: string;
  stack?: string;
  extra?: Record<string, any>;
}) {
  try {
    const msg = payload.message || "";
    const url = /https?:\/\/[^\s]+/i.exec(msg)?.[0] ?? "";

    // Session de-dupe for resource messages
    if (url) {
      const key = payload.type + "|" + url;
      if (seenThisSession.has(key)) return;
      seenThisSession.add(key);
    }

    // Boundary errors bypass noise rules
    const isBoundary = payload.extra?.source === "boundary";

    if (!isBoundary && url) {
      if (IGNORE_URL_PATTERNS.some(rx => rx.test(url))) {
        return; // drop completely
      }
      if (DOWNGRADE_TO_INFO.some(rx => rx.test(url))) {
        payload.level = "info";
      }
    }

    fetch("/api/observability/errors", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "Client-Error-Capture"
      },
      body: JSON.stringify({
        service: "client",
        level: payload.level ?? "error",
        env: import.meta.env.MODE === "production" ? "production" : "development",
        url: window.location.pathname + window.location.search,
        message: payload.message,
        type: payload.type,
        stack: payload.stack,
        user: (window as any).__CF_USER ? { id: (window as any).__CF_USER.id } : undefined,
        tags: { ua: navigator.userAgent },
        extra: payload.extra,
      }),
      keepalive: true, // Allow during page unload
    });
  } catch (reportError) {
    // Silently fail to avoid infinite loops
    console.warn("Failed to report error:", reportError);
  }
}

export function installGlobalErrorHandlers() {
  // Capture unhandled JavaScript errors
  window.addEventListener("error", (event) => {
    reportClientError({
      message: event.message ?? "Unhandled error",
      type: (event.error && event.error.name) || "Error",
      stack: (event.error && event.error.stack) || undefined,
      extra: { 
        filename: event.filename, 
        lineno: event.lineno, 
        colno: event.colno,
        source: "window.onerror"
      },
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason: any = event.reason || {};
    reportClientError({
      message: String(reason.message || event.reason || "Unhandled promise rejection"),
      type: reason.name || "UnhandledRejection",
      stack: reason.stack,
      extra: {
        source: "unhandledrejection",
        reason: String(event.reason)
      }
    });
  });

  // Capture resource loading errors
  window.addEventListener("error", (event) => {
    const target = event.target as HTMLElement | null;
    if (target && target !== (window as any) && (target.tagName === "IMG" || target.tagName === "SCRIPT" || target.tagName === "LINK")) {
      reportClientError({
        level: "warn",
        message: `Failed to load ${target.tagName.toLowerCase()}: ${(target as any).src || (target as any).href}`,
        type: "ResourceError",
        extra: {
          tagName: target.tagName,
          src: (target as any).src,
          href: (target as any).href,
          source: "resource.onerror"
        }
      });
    }
  }, true); // Use capture phase for resource errors

  console.log("🔍 Client error tracking initialized");
}

// Manual error reporting for try/catch blocks
export function captureException(error: Error, extra?: Record<string, any>) {
  reportClientError({
    message: error.message,
    type: error.name,
    stack: error.stack,
    extra: {
      ...extra,
      source: "manual"
    }
  });
}

// Manual message reporting (like console.warn/error with tracking)
export function captureMessage(message: string, level: "error" | "warn" | "info" = "info", extra?: Record<string, any>) {
  reportClientError({
    level,
    message,
    type: "ManualMessage",
    extra: {
      ...extra,
      source: "manual"
    }
  });
}

// Performance monitoring
export function capturePerformance(name: string, duration: number, extra?: Record<string, any>) {
  if (duration > 1000) { // Only report slow operations
    reportClientError({
      level: "warn",
      message: `Slow operation: ${name} took ${duration}ms`,
      type: "PerformanceIssue",
      extra: {
        ...extra,
        duration,
        name,
        source: "performance"
      }
    });
  }
}