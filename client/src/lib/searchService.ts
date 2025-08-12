// URL parameter management for unified search system
interface SearchParams {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
}

// Subscribers for search changes
const subscribers: Array<(params: SearchParams) => void> = [];

// Get current search parameters from URL - null-safe version
export function getQuery(): SearchParams {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page');
  const pageNum = pageParam ? parseInt(pageParam, 10) : undefined;
  
  return {
    q: params.get('q') || undefined,
    category: params.get('category') || undefined,
    sort: params.get('sort') || undefined,
    page: pageNum && pageNum > 0 ? pageNum : undefined,
  };
}

// Set search parameters in URL
export function setQuery(updates: Partial<SearchParams>, options: { replace?: boolean } = {}) {
  if (typeof window === 'undefined') return;
  
  const current = getQuery();
  const merged = { ...current, ...updates };
  
  // Remove undefined/empty values
  Object.keys(merged).forEach(key => {
    const value = merged[key as keyof SearchParams];
    if (value === undefined || value === '' || value === null) {
      delete merged[key as keyof SearchParams];
    }
  });
  
  const params = new URLSearchParams();
  if (merged.q) params.set('q', merged.q);
  if (merged.category) params.set('category', merged.category);
  if (merged.sort) params.set('sort', merged.sort);
  if (merged.page && merged.page > 1) params.set('page', merged.page.toString());
  
  const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  
  if (options.replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
  
  // Notify subscribers
  const newParams = getQuery();
  subscribers.forEach(fn => fn(newParams));
  
  // Track analytics
  trackSearchAnalytics(merged.q || '', merged.category || '');
}

// Subscribe to search changes
export function subscribe(fn: (params: SearchParams) => void): () => void {
  subscribers.push(fn);
  
  // Listen for browser back/forward
  const handlePopState = () => {
    const params = getQuery();
    subscribers.forEach(callback => callback(params));
  };
  
  if (subscribers.length === 1) {
    // Only add listener once
    window.addEventListener('popstate', handlePopState);
  }
  
  return () => {
    const index = subscribers.indexOf(fn);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
    
    // Remove listener when no subscribers
    if (subscribers.length === 0) {
      window.removeEventListener('popstate', handlePopState);
    }
  };
}

// Helper to clear search
export function clearSearch(options: { replace?: boolean } = {}) {
  setQuery({ 
    q: undefined, 
    page: 1  // Reset to page 1
  }, options);
}

// Analytics tracking
function trackSearchAnalytics(q: string, category: string) {
  if (typeof window !== 'undefined' && q) {
    console.log('🔍 Search Analytics:', { q, category, url: window.location.href });
  }
}

// Global keyboard shortcuts
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    // Global '/' key to focus search bar
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const activeElement = document.activeElement;
      const isInInput = activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName);
      
      if (!isInInput) {
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