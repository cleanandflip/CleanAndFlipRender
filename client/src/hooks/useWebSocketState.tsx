import { useState, useEffect } from "react";

// Global WebSocket state singleton
class WebSocketState {
  private listeners = new Set<(ready: boolean) => void>();
  private _ready = false;

  get ready() {
    return this._ready;
  }

  setReady(ready: boolean) {
    if (this._ready !== ready) {
      this._ready = ready;
      console.log('🔌 Global WebSocket state changed to:', ready);
      this.listeners.forEach(listener => listener(ready));
    }
  }

  subscribe(listener: (ready: boolean) => void) {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this._ready);
    return () => this.listeners.delete(listener);
  }
}

export const webSocketState = new WebSocketState();

// Hook to use the global WebSocket state
export function useWebSocketReady() {
  const [ready, setReady] = useState(webSocketState.ready);

  useEffect(() => {
    const unsubscribe = webSocketState.subscribe(setReady);
    return unsubscribe;
  }, []);

  return ready;
}
// Export useWebSocketState function expected by admin components
export function useWebSocketState() {
  const ready = useWebSocketReady();
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  return {
    ready,
    lastMessage,
    send: () => {},
    subscribe: () => () => {}
  };
}

// Add SocketProvider component expected by main.tsx  
export function SocketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
