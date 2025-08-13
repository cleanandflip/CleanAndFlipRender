// server/websocket.ts
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

// --- Types (single source of truth) ----------------
export type Role = "guest" | "user" | "admin";

export type Topics =
  | "connection:ok"
  | "auth:ok"
  | "auth:error"
  | "product:update"
  | "category:update"
  | "user:update"
  | "submission:update"
  | "stock:update"
  | "cart:update"        // targeted to a user
  | "locality:update"
  | "toast:info"
  | "toast:warn"
  | "toast:error"
  | "sys:pong";

export type ServerToClient =
  | { topic: "connection:ok"; clientId: string; role: Role | null }
  | { topic: "auth:ok"; role: Role; userId?: string }
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

export type ClientToServer =
  | { topic: "auth"; token?: string }
  | { topic: "sys:ping" }
  | { topic: "subscribe"; topics: Topics[] }       // optional future use
  | { topic: "unsubscribe"; topics: Topics[] };

// --- Manager --------------------------------------
type ClientInfo = {
  id: string;
  ws: WebSocket;
  role: Role;
  userId?: string;
  alive: boolean;
};

export class WebSocketManager {
  private wss!: WebSocketServer;
  private clients = new Map<string, ClientInfo>();

  attach(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (ws) => this.onConnection(ws));
    // Heartbeat
    setInterval(() => this.heartbeat(), 30_000);
  }

  private onConnection(ws: WebSocket) {
    const id = crypto.randomUUID();
    const client: ClientInfo = { id, ws, role: "guest", alive: true };
    this.clients.set(id, client);

    this.safeSend(client, { topic: "connection:ok", clientId: id, role: null });

    ws.on("message", (raw) => this.onMessage(client, raw));
    ws.on("pong", () => (client.alive = true));
    ws.on("close", () => this.clients.delete(id));
    ws.on("error", () => ws.close());
  }

  private onMessage(client: ClientInfo, raw: WebSocket.RawData) {
    let msg: any;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return this.safeSend(client, { topic: "toast:error", message: "Invalid WS payload" });
    }

    switch (msg.topic as ClientToServer["topic"]) {
      case "auth": {
        // TODO: verify token (JWT or session) and resolve userId + role
        const { userId, role } = this.verifyToken(msg.token);
        client.role = role;
        client.userId = userId;
        this.safeSend(client, { topic: "auth:ok", role, userId });
        break;
      }
      case "sys:ping":
        this.safeSend(client, { topic: "sys:pong" });
        break;
      case "subscribe":
      case "unsubscribe":
        // Optional: store per-client topic filters if you later want server-side filtering
        break;
      default:
        // Ignore unknown client topics for safety
        break;
    }
  }

  private heartbeat() {
    for (const c of this.clients.values()) {
      if (!c.alive) { c.ws.terminate(); this.clients.delete(c.id); continue; }
      c.alive = false;
      try { c.ws.ping(); } catch {}
    }
  }

  private safeSend<T extends ServerToClient>(c: ClientInfo, data: T) {
    if (c.ws.readyState === c.ws.OPEN) {
      c.ws.send(JSON.stringify(data));
    }
  }

  // --- Publish APIs (use these from routes/services) --------
  publish<T extends ServerToClient>(data: T) {
    for (const c of this.clients.values()) this.safeSend(c, data);
  }

  publishToRole<T extends ServerToClient>(role: Role, data: T) {
    for (const c of this.clients.values()) if (c.role === role) this.safeSend(c, data);
  }

  publishToUser<T extends ServerToClient>(userId: string, data: T) {
    for (const c of this.clients.values()) if (c.userId === userId) this.safeSend(c, data);
  }

  // Simple token verifier placeholder; replace with your real auth
  private verifyToken(token?: string): { userId?: string; role: Role } {
    // Example: decode JWT or read session store
    if (!token) return { role: "guest" };
    // …your logic…
    return { userId: "decoded-user-id", role: "user" };
  }

  // Legacy compatibility methods for gradual migration
  getConnectionCount(): number {
    return this.clients.size;
  }

  getStats() {
    const roleStats: Record<string, number> = {};
    this.clients.forEach(client => {
      if (client.role) {
        roleStats[client.role] = (roleStats[client.role] || 0) + 1;
      }
    });

    return {
      totalConnections: this.clients.size,
      roleBreakdown: roleStats,
      timestamp: new Date().toISOString()
    };
  }

  cleanup() {
    this.clients.forEach(client => {
      client.ws.terminate();
    });
    this.clients.clear();
    this.wss.close();
  }
}

// Singleton instance + helper exports
export const wsManager = new WebSocketManager();

// Legacy compatibility
export function setupWebSocket(server: http.Server) {
  wsManager.attach(server);
  return wsManager;
}