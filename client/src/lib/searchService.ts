// Tiny URL state helper for q/category/sort/page
type Query = { q: string; category: string; sort: string; page: number; fulfillment?: string };

const parse = (): Query => {
  if (typeof window === 'undefined') {
    return { q: '', category: '', sort: '', page: 1 };
  }
  const sp = new URLSearchParams(window.location.search);
  const q         = (sp.get("q") ?? "");
  const category  = (sp.get("category") ?? "");
  const sort      = (sp.get("sort") ?? "");
  const fulfillment = sp.get("fulfillment") || undefined;
  const pageRaw   = Number(sp.get("page") ?? "1");
  const page      = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return { q, category, sort, page, fulfillment };
};

const write = (next: Partial<Query>, opts: { replace?: boolean } = {}) => {
  if (typeof window === 'undefined') return;
  const sp = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined || v === null || v === "") sp.delete(k);
    else sp.set(k, String(v));
  }
  const url = `${window.location.pathname}${sp.toString() ? "?" + sp.toString() : ""}`;
  (opts.replace ? history.replaceState : history.pushState).call(history, null, "", url);
  // notify listeners
  window.dispatchEvent(new PopStateEvent("popstate"));
};

type Unsub = () => void;
const subs = new Set<() => void>();
const subscribe = (fn: () => void): Unsub => {
  subs.add(fn);
  const handler = () => fn();
  window.addEventListener("popstate", handler);
  return () => { subs.delete(fn); window.removeEventListener("popstate", handler); };
};

// Busy state for search loading
let busy = false;
const busySubs = new Set<() => void>();

export function setSearchBusy(next: boolean) {
  if (busy === next) return;
  busy = next;
  busySubs.forEach(fn => fn());
}

export function isSearchBusy() {
  return busy;
}

export function subscribeSearchBusy(fn: () => void) {
  busySubs.add(fn);
  return () => busySubs.delete(fn);
}

export const searchService = {
  getQuery: parse,
  setQuery: write,
  subscribe,
  // Busy state
  isBusy: isSearchBusy,
  setBusy: setSearchBusy,
  subscribeBusy: subscribeSearchBusy,
};

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