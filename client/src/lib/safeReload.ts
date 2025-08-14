// Safety net: one-line guard to prevent reloads during development
export function safeReload() {
  if (import.meta.env.VITE_DISABLE_HARD_RELOADS === 'true') return;
  window.location.reload();
}