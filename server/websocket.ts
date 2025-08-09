// ROBUST WEBSOCKET SERVER WITH HEARTBEAT AND LIVE SYNC
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WSClient {
  ws: WebSocket;
  id: string;
  userId?: string;
  role?: string;
  isAlive: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      perMessageDeflate: false,
      clientTracking: true
    });

    this.setupWebSocket();
    this.startHeartbeat();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = this.generateId();
      
      const client: WSClient = {
        ws,
        id: clientId,
        isAlive: true
      };

      this.clients.set(clientId, client);
      console.log(`[WS] Client connected: ${clientId} (Total: ${this.clients.size})`);

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      }));

      // Handle pong for heartbeat
      ws.on('pong', () => {
        client.isAlive = true;
      });

      // Handle messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('[WS] Message parse error:', error);
        }
      });

      // Handle close
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`[WS] Client disconnected: ${clientId} (Remaining: ${this.clients.size})`);
      });

      // Handle error
      ws.on('error', (error) => {
        console.error(`[WS] Client error ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Handle authentication
    if (data.type === 'auth') {
      client.userId = data.userId;
      client.role = data.role;
      console.log(`[WS] Client authenticated: ${clientId} (${data.role})`);
      return;
    }

    // Add timestamp and broadcast to all other clients
    const messageWithTimestamp = {
      ...data,
      timestamp: new Date().toISOString(),
      sourceClient: clientId
    };

    this.broadcast(messageWithTimestamp, clientId);
  }

  public broadcast(data: any, excludeClientId?: string) {
    const message = JSON.stringify(data);
    let successCount = 0;
    
    this.clients.forEach((client, id) => {
      if (id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          successCount++;
        } catch (error) {
          console.error(`[WS] Broadcast error to ${id}:`, error);
          this.clients.delete(id);
        }
      }
    });

    if (successCount > 0) {
      console.log(`[WS] Broadcasted ${data.type} to ${successCount} clients`);
    }
  }

  public broadcastToRole(data: any, role: string) {
    const message = JSON.stringify(data);
    let successCount = 0;
    
    this.clients.forEach((client) => {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message);
          successCount++;
        } catch (error) {
          console.error(`[WS] Role broadcast error:`, error);
        }
      }
    });

    console.log(`[WS] Broadcasted to ${successCount} ${role} clients`);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, id) => {
        if (!client.isAlive) {
          console.log(`[WS] Terminating dead client: ${id}`);
          client.ws.terminate();
          this.clients.delete(id);
          return;
        }
        
        client.isAlive = false;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, 30000); // 30 seconds
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  public getConnectionCount(): number {
    return this.clients.size;
  }

  public getStats() {
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

  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.clients.forEach(client => {
      client.ws.terminate();
    });
    
    this.clients.clear();
    this.wss.close();
  }
}

export let wsManager: WebSocketManager;

export function setupWebSocket(server: Server) {
  wsManager = new WebSocketManager(server);
  return wsManager;
}

// Utility function for API routes to broadcast updates
export function broadcastUpdate(type: string, data: any) {
  if (wsManager) {
    wsManager.broadcast({
      type,
      data,
      timestamp: new Date().toISOString()
    });
  }
}