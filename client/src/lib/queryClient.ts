import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
function buildUrl(queryKey: readonly unknown[]): string {
  const [baseUrl, params] = queryKey;
  
  if (typeof baseUrl !== 'string') {
    throw new Error('First element of queryKey must be a URL string');
  }
  
  // If there are no params or params is not an object, just return the base URL
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return baseUrl;
  }
  
  // Build query string from params object
  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrl(queryKey);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Global product events for real-time synchronization
export const productEvents = new EventTarget();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      staleTime: 0, // Always fresh - no stale data allowed
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: 'always',
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // Disable to prevent reload loops
      retry: 1
    },
    mutations: {
      retry: 0, // No retry for mutations - fail fast
    },
  },
});

// Dev diagnostics - removed problematic error listener that caused TS errors

// Global function to broadcast product updates
export const broadcastProductUpdate = (productId: string, action: string, updates?: any) => {
  // Broadcasting product update event
  
  // Dispatch custom events for cross-component synchronization
  productEvents.dispatchEvent(
    new CustomEvent('productUpdated', { 
      detail: { productId, action, updates, timestamp: Date.now() } 
    })
  );
  
  // Also dispatch on window for backward compatibility
  window.dispatchEvent(
    new CustomEvent('productUpdated', { 
      detail: { productId, action, updates, timestamp: Date.now() } 
    })
  );
  
  // Immediately invalidate ALL product-related queries
  queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  queryClient.invalidateQueries({ queryKey: ['/api/products/featured'] });
  queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
  
  // Invalidate specific product if available
  if (productId) {
    queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
  }
  
  // Force immediate refetch for critical queries
  queryClient.refetchQueries({ queryKey: ['/api/products'] });
  queryClient.refetchQueries({ queryKey: ['/api/products/featured'] });
};
