// Route-aware search coordinator for proper nav search behavior
import { searchService } from "@/lib/searchService";

export function beginSearchFrom(pathname: string) {
  // Write origin into history state without touching URL
  const state = { ...(history.state || {}), __searchFrom: pathname };
  history.replaceState(state, "", window.location.href);
}

export function getSearchOrigin(): string | null {
  return history.state && history.state.__searchFrom ? history.state.__searchFrom : null;
}

export function clearSearchOrigin() {
  const { __searchFrom, ...rest } = history.state || {};
  history.replaceState(rest, "", window.location.href);
}