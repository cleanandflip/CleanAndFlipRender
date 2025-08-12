// Unified Search Service - Single source of truth for URL-driven search state
// Handles query parameters, URL syncing, and provides reactive subscriptions

export interface SearchQuery {
  q: string;
  category: string;
  sort?: string;
  page?: number;
}

type SearchSubscriber = (query: SearchQuery) => void;
const subscribers: SearchSubscriber[] = [];

// Get current query state from URL
export function getQueryFromURL(): SearchQuery {
  const params = new URLSearchParams(window.location.search);
  
  return {
    q: params.get('q') || '',
    category: params.get('category') || '',
    sort: params.get('sort') || undefined,
    page: params.get('page') ? parseInt(params.get('page')!, 10) : undefined
  };
}

// Update URL with new query parameters (preserves unspecified params)
export function setQueryInURL(
  patch: Partial<SearchQuery>, 
  options: { replace?: boolean; navigate?: boolean } = {}
): void {
  const currentParams = new URLSearchParams(window.location.search);
  const { replace = false, navigate = true } = options;
  
  // Apply patches
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined || value === '' || value === null) {
      currentParams.delete(key);
    } else {
      currentParams.set(key, String(value));
    }
  });
  
  // Build new URL
  const query = currentParams.toString();
  const newPath = `/products${query ? `?${query}` : ''}`;
  
  // Update browser history
  if (navigate) {
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', newPath);
    
    // Notify subscribers
    notifySubscribers();
  }
  
  // Analytics event
  if (patch.q !== undefined) {
    emitSearchAnalytics(patch.q, patch.category || getQueryFromURL().category);
  }
}

// Subscribe to query changes (for back/forward navigation)
export function subscribeToQuery(fn: SearchSubscriber): () => void {
  subscribers.push(fn);
  
  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(fn);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

// Notify all subscribers of query changes
function notifySubscribers(): void {
  const currentQuery = getQueryFromURL();
  subscribers.forEach(fn => fn(currentQuery));
}

// Handle browser back/forward navigation
function handlePopState(): void {
  notifySubscribers();
}

// Initialize popstate listener
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', handlePopState);
}

// Analytics helper
function emitSearchAnalytics(q: string, category: string): void {
  // Emit analytics event if analytics service is available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'search_changed', {
      search_term: q,
      category: category || 'all',
      page_location: window.location.href
    });
  }
  
  // Console log for development
  console.log('🔍 Search Analytics:', { q, category, url: window.location.href });
}

// Global keyboard shortcuts - only active on products page
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    // Global '/' key to focus search bar - only on products page
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const activeElement = document.activeElement;
      const isInInput = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);
      const isOnProductsPage = window.location.pathname.startsWith('/products');
      
      if (!isInInput && isOnProductsPage) {
        e.preventDefault();
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    }
  });
}