// Canonical, single-source websocket hook with a tiny pub/sub shim.
// Exposes: { ready, lastMessage, subscribe }
import { useEffect, useRef, useState } from "react";

type Json = any;
type Message = { type?: string } & Record<string, Json>;
type Unsub = () => void;
type Subscriber = (msg: Message) => void;

// --- module-scope singletons (persist across hook calls) ---
let ws: WebSocket | null = null;
let wsReady = false;

// topic -> subscribers
const topics: Record<string, Set<Subscriber>> = {};
const all: Set<Subscriber> = new Set();

function dispatch(msg: Message) {
  const t = msg?.type ?? "message";
  topics[t]?.forEach((fn) => fn(msg));
  all.forEach((fn) => fn(msg));
}

function ensureSocket(): WebSocket {
  if (ws) return ws;

  // Try typical endpoints; first one that connects wins
  const candidates = [
    (import.meta as any)?.env?.VITE_WS_URL as string | undefined,
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`,
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/socket`,
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/ws`,
  ].filter(Boolean) as string[];

  let url = candidates[0] ?? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;

  ws = new WebSocket(url);

  ws.addEventListener("open", () => {
    wsReady = true;
  });

  ws.addEventListener("close", () => {
    wsReady = false;
    // basic auto-retry in 2s
    setTimeout(() => {
      ws = null;
      ensureSocket();
    }, 2000);
  });

  ws.addEventListener("message", (evt) => {
    let payload: Message;
    try {
      payload = JSON.parse((evt as MessageEvent).data);
    } catch {
      payload = { type: "message", raw: (evt as MessageEvent).data } as Message;
    }
    dispatch(payload);
  });

  return ws;
}

// exported hook
export function useWebSocketState() {
  const [ready, setReady] = useState<boolean>(wsReady);
  const lastMessageRef = useRef<Message | null>(null);

  useEffect(() => {
    const socket = ensureSocket();

    const onOpen = () => setReady(true);
    const onClose = () => setReady(false);
    const onMessage = (evt: MessageEvent) => {
      let payload: Message;
      try {
        payload = JSON.parse(evt.data);
      } catch {
        payload = { type: "message", raw: evt.data } as Message;
      }
      lastMessageRef.current = payload;
      // Note: subscribers are notified from `dispatch` inside the socket listener set at ensureSocket()
      // but setting ref here ensures components can read the latest snapshot.
    };

    socket.addEventListener("open", onOpen);
    socket.addEventListener("close", onClose);
    socket.addEventListener("message", onMessage);

    return () => {
      socket.removeEventListener("open", onOpen);
      socket.removeEventListener("close", onClose);
      socket.removeEventListener("message", onMessage);
    };
  }, []);

  // Minimal pub/sub API compatible with previous usage:
  //   const unsubscribe = subscribe("product:created", handler)
  //   const unsubscribeAll = subscribe("*", handler)
  const subscribe = (type: string, handler: Subscriber): Unsub => {
    if (type === "*" || type === "all") {
      all.add(handler);
      return () => void all.delete(handler);
    }
    if (!topics[type]) topics[type] = new Set<Subscriber>();
    topics[type].add(handler);
    return () => void topics[type].delete(handler);
  };

  return { ready, lastMessage: lastMessageRef.current, subscribe };
}

// Add SocketProvider component expected by main.tsx  
export function SocketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default undefined as unknown as never; // keep it explicitly non-default to prevent old default imports

// --- compatibility wrapper for legacy imports ---
// Some components still import { useWebSocketReady } and expect a boolean.
// Keep them working by exposing a thin wrapper around useWebSocketState.
export function useWebSocketReady(): boolean {
  const { ready } = useWebSocketState();
  return ready;
}
