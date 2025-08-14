import { useEffect, useRef, useState, useCallback } from "react";

type Msg = any;
type Sub = (m: Msg) => void;

let socket: WebSocket | null = null;
const subs = new Set<Sub>();

function ensureSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return socket;
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  socket.onmessage = (ev) => {
    let data: any = undefined;
    try { data = JSON.parse(ev.data); } catch { data = ev.data; }
    subs.forEach(fn => { try { fn(data); } catch {} });
  };
  return socket;
}

export function useWebSocketState() {
  const [ready, setReady] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const isMounted = useRef(true);

  useEffect(() => () => { isMounted.current = false; }, []);

  useEffect(() => {
    const s = ensureSocket();
    const onOpen = () => isMounted.current && setReady(true);
    const onClose = () => isMounted.current && setReady(false);
    const onMsg = (ev: MessageEvent) => {
      try { setLastMessage(JSON.parse(ev.data)); } catch { setLastMessage(ev.data); }
    };
    s.addEventListener("open", onOpen);
    s.addEventListener("close", onClose);
    s.addEventListener("message", onMsg);
    return () => {
      s.removeEventListener("open", onOpen);
      s.removeEventListener("close", onClose);
      s.removeEventListener("message", onMsg);
    };
  }, []);

  const subscribe = useCallback((fn: Sub) => {
    subs.add(fn);
    return () => subs.delete(fn);
  }, []);

  // publish with graceful fallback
  const sendJsonMessage = useCallback((typeOrPayload: any, maybePayload?: any) => {
    const s = ensureSocket();
    const payload = typeof typeOrPayload === "string"
      ? { type: typeOrPayload, payload: maybePayload }
      : typeOrPayload;
    try { s.send(JSON.stringify(payload)); } catch {}
  }, []);

  const publish = sendJsonMessage; // alias for compatibility

  return { ready, lastMessage, subscribe, sendJsonMessage, publish };
}

// Add SocketProvider component expected by main.tsx  
export function SocketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default undefined as unknown as never; // keep it explicitly non-default to prevent old default imports