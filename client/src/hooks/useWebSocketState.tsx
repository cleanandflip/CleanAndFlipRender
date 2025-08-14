import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// ---- module-singleton so multiple hooks share one socket ----
let _socket: WebSocket | null = null;
let _connected = false;
const _listeners = new Map<string, Set<(payload: any) => void>>();

function ensureSocket() {
  if (_socket) return _socket;

  const wsUrl =
    (import.meta as any).env?.VITE_WS_URL ||
    location.origin.replace(/^http/, "ws") + "/ws";

  _socket = new WebSocket(wsUrl);

  _socket.addEventListener("open", () => {
    _connected = true;
  });

  _socket.addEventListener("close", () => {
    _connected = false;
    // lightweight retry
    setTimeout(() => {
      _socket = null;
      ensureSocket();
    }, 2000);
  });

  _socket.addEventListener("message", (e) => {
    try {
      const msg = JSON.parse(e.data);
      const type = msg.type ?? msg.topic;     // tolerate old server format
      const payload = msg.payload ?? msg.data ?? msg; // tolerate variants
      if (!type) return;
      
      const set = _listeners.get(type);
      if (set) for (const fn of set) fn(payload);
    } catch {}
  });

  return _socket;
}

export function useWebSocketState() {
  const [, force] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = ensureSocket();
    const id = setInterval(() => force((n) => n + 1), 500); // shallow reactivity for connected flag
    return () => clearInterval(id);
  }, []);

  const subscribe = useCallback((type: string, handler: (payload: any) => void) => {
    if (!_listeners.has(type)) _listeners.set(type, new Set());
    _listeners.get(type)!.add(handler);
    return () => _listeners.get(type)!.delete(handler);
  }, []);

  const publish = useCallback((type: string, payload?: any) => {
    const s = socketRef.current ?? _socket;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return useMemo(
    () => ({ connected: _connected, socket: socketRef.current, subscribe, publish }),
    [_connected, socketRef.current, subscribe, publish]
  );
}

// ---- Compatibility so legacy code won't crash ----
export const useWebSocketReady = () => {
  const { connected } = useWebSocketState();
  return connected;
};

// Some legacy code destructures { send }, so provide a no-op alias.
export function useLegacySocket() {
  const { publish } = useWebSocketState();
  const send = publish; // alias
  return { send, publish };
}

// Compatibility wrapper component for legacy App.tsx
export function SocketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}