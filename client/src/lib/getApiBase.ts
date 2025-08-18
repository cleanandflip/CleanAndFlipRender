// src/lib/getApiBase.ts
export function getApiBase() {
  // Prefer same-origin relative calls in Next.js/SPA to avoid cross-env hits
  return import.meta.env.VITE_API_BASE_URL || '';
}

// Helper to ensure we're using the correct API base for this environment
export function buildApiUrl(path: string): string {
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If no base URL is set, use relative paths (preferred for same-origin)
  if (!base) {
    return cleanPath;
  }
  
  // Remove trailing slash from base and ensure clean joining
  return `${base.replace(/\/$/, '')}${cleanPath}`;
}

// Log the current API configuration for debugging
console.log(`[API_CONFIG] Using API base: ${getApiBase() || 'relative paths (same-origin)'}`);