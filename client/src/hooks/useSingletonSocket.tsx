import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

// Mirror server Topics for type-safety (keep in sync)
type Topics =
  | "connection:ok"
  | "auth:ok"
  | "auth:error"
  | "product:update"
  | "category:update"
  | "user:update"
  | "submission:update"
  | "stock:update"
  | "cart:update"
  | "locality:update"
  | "toast:info"
  | "toast:warn"
  | "toast:error"
  | "sys:pong";

type ServerToClient =
  | { topic: "connection:ok"; clientId: string; role: string | null }
  | { topic: "auth:ok"; role: string; userId?: string }
  | { topic: "auth:error"; reason: string }
  | { topic: "cart:update"; userId: string; count: number }
  | { topic: "locality:update"; userId: string; isLocal: boolean }
  | { topic: "product:update"; productId: string }
  | { topic: "category:update"; categoryId: string }
  | { topic: "user:update"; userId: string }
  | { topic: "submission:update"; submissionId: string }
  | { topic: "stock:update"; productId: string; qty: number }
  | { topic: "toast:info" | "toast:warn" | "toast:error"; message: string }
  | { topic: "sys:pong" };

type ClientToServer =
  | { topic: "auth"; token?: string }
  | { topic: "sys:ping" }
  | { topic: "subscribe"; topics: Topics[] }
  | { topic: "unsubscribe"; topics: Topics[] };

type Handler<T = any> = (msg: T) => void;

type Ctx = {
  ready: boolean;
  send: (msg: ClientToServer) => void;
  subscribe: <T extends ServerToClient>(topic: T["topic"], fn: Handler<T>) => () => void;
};

const SocketCtx = createContext<Ctx>({ ready: false, send: () => {}, subscribe: () => () => {} });

function makeUrl() {
  return window.location.origin.replace(/^http/, "ws") + "/ws";
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const sockRef = useRef<WebSocket | null>(null);
  const handlers = useRef<Map<string, Set<Handler>>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (sockRef.current) return;

    let retry = 0;
    const connect = () => {
      const ws = new WebSocket(makeUrl());
      sockRef.current = ws;

      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ topic: "sys:ping" }));
      }, 25_000);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected to', makeUrl());
        console.log('🔌 Setting ready to true');
        setReady(true);
        retry = 0;
        // optional: send auth token if available (cookie/session)
        const token = window.localStorage.getItem("accessToken") || undefined;
        ws.send(JSON.stringify({ topic: "auth", token }));
      };

      ws.onmessage = (ev) => {
        let data: ServerToClient | null = null;
        try { data = JSON.parse(ev.data); } catch { return; }
        if (!data) return;
        const set = handlers.current.get(data.topic);
        if (!set) return;
        for (const fn of set) fn(data as any);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected, retrying in', Math.min(1000 * 2 ** retry, 15_000), 'ms');
        clearInterval(heartbeat);
        setReady(false);
        sockRef.current = null;
        setTimeout(connect, Math.min(1000 * 2 ** retry++, 15_000));
      };

      ws.onerror = (error) => {
        console.log('🔌 WebSocket error:', error);
        ws.close();
      };
    };

    console.log('🔌 Initializing WebSocket connection to', makeUrl());
    connect();
    return () => { sockRef.current?.close(); sockRef.current = null; setReady(false); };
  }, []);

  const api: Ctx = useMemo(() => ({
    ready,
    send: (msg: ClientToServer) => {
      const ws = sockRef.current;
      if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    },
    subscribe: (topic, fn) => {
      const map = handlers.current;
      if (!map.has(topic)) map.set(topic, new Set());
      map.get(topic)!.add(fn);
      return () => map.get(topic)?.delete(fn);
    },
  }), [ready]);

  return <SocketCtx.Provider value={api}>{children}</SocketCtx.Provider>;
}

export function useSocket() { return useContext(SocketCtx); }

// Legacy shim so existing imports keep working during migration:
export function useSingletonSocket() { return useSocket(); }