import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// ---- Enhanced module-singleton with production-grade reliability ----
let _socket: WebSocket | null = null;
let _connected = false;
let _connecting = false;
let _lastMessage: any = null;
let _reconnectAttempts = 0;
let _reconnectTimer: NodeJS.Timeout | null = null;
let _pingTimer: NodeJS.Timeout | null = null;
const _listeners = new Map<string, Set<(payload: any) => void>>();
const _stateListeners = new Set<() => void>();

const MAX_RECONNECT_ATTEMPTS = 50;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const PING_INTERVAL = 25000; // Send ping every 25 seconds

// Generate proper WebSocket URL for both dev and prod environments
function getWebSocketUrl(): string {
	const env = (import.meta as any).env?.VITE_WS_URL;
	if (env) return env;
	
	// Derive from API base when available (supports cross-origin Builder preview)
	const apiBase = (import.meta as any).env?.VITE_API_URL as string | undefined;
	if (apiBase && typeof apiBase === 'string' && apiBase.startsWith('http')) {
		try {
			const api = new URL(apiBase);
			const wsProtocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
			return `${wsProtocol}//${api.host}/ws`;
		} catch {
			// ignore and fall through to window.location
		}
	}
	
	const { protocol, host } = window.location;
	const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
	return `${wsProtocol}//${host}/ws`;
}

// Calculate exponential backoff delay
function getReconnectDelay(): number {
	const delay = Math.min(
		INITIAL_RECONNECT_DELAY * Math.pow(2, _reconnectAttempts),
		MAX_RECONNECT_DELAY
	);
	return delay + Math.random() * 1000; // Add jitter
}

// Notify all state listeners of connection changes
function notifyStateChange() {
	_stateListeners.forEach(listener => listener());
}

// Enhanced socket creation with comprehensive error handling
function createSocket(): WebSocket | null {
	if (_connecting || (_socket && _socket.readyState === WebSocket.CONNECTING)) {
		return _socket;
	}

	if (_reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
		console.error('🚫 WebSocket: Max reconnection attempts reached');
		return null;
	}

	try {
		_connecting = true;
		const wsUrl = getWebSocketUrl();
		console.log('🔌 WebSocket: Attempting connection to', wsUrl);
		
		const socket = new WebSocket(wsUrl);
		
		// Connection opened
		socket.addEventListener("open", () => {
			console.log('✅ WebSocket: Connected successfully');
			_connected = true;
			_connecting = false;
			_reconnectAttempts = 0;
			
			// Start heartbeat
			startPing();
			
			// Send initial auth/ping
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ topic: "sys:ping" }));
			}
			
			notifyStateChange();
		});

		// Connection closed
		socket.addEventListener("close", (event) => {
			console.log('🔌 WebSocket: Connection closed', { code: event.code, reason: event.reason });
			_connected = false;
			_connecting = false;
			
			// Clear ping timer
			if (_pingTimer) {
				clearInterval(_pingTimer);
				_pingTimer = null;
			}
			
			// Schedule reconnection if not a normal closure
			if (event.code !== 1000 && _reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
				scheduleReconnect();
			}
			
			notifyStateChange();
		});

		// Connection error
		socket.addEventListener("error", (error) => {
			console.error('❌ WebSocket: Connection error', error);
			_connected = false;
			_connecting = false;
			notifyStateChange();
		});

		// Message received
		socket.addEventListener("message", (event) => {
			try {
				const msg = JSON.parse(event.data);
				const type = msg.type ?? msg.topic;
				const payload = msg.payload ?? msg.data ?? msg;
				
				if (!type) return;
				
				// Handle system messages
				if (type === 'sys:pong') {
					// Server responded to ping - connection is healthy
					return;
				}
				
				_lastMessage = { type, payload };
				
				// Notify subscribers
				const listeners = _listeners.get(type);
				if (listeners) {
					listeners.forEach(fn => {
						try {
							fn(payload);
						} catch (error) {
							console.error('🐛 WebSocket: Error in message handler', error);
						}
					});
				}
			} catch (error) {
				console.error('🐛 WebSocket: Failed to parse message', error);
			}
		});

		return socket;
	} catch (error) {
		console.error('🚫 WebSocket: Failed to create connection', error);
		_connecting = false;
		scheduleReconnect();
		return null;
	}
}

// Schedule reconnection with exponential backoff
function scheduleReconnect() {
	if (_reconnectTimer) return; // Already scheduled
	
	_reconnectAttempts++;
	const delay = getReconnectDelay();
	
	console.log(`🔄 WebSocket: Reconnecting in ${Math.round(delay/1000)}s (attempt ${_reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
	
	_reconnectTimer = setTimeout(() => {
		_reconnectTimer = null;
		_socket = createSocket();
	}, delay);
}

// Start heartbeat ping
function startPing() {
	if (_pingTimer) {
		clearInterval(_pingTimer);
	}
	
	_pingTimer = setInterval(() => {
		if (_socket && _socket.readyState === WebSocket.OPEN) {
			try {
				_socket.send(JSON.stringify({ topic: "sys:ping" }));
			} catch (error) {
				console.error('🐛 WebSocket: Failed to send ping', error);
			}
		}
	}, PING_INTERVAL);
}

// Ensure socket exists and is connected
function ensureSocket(): WebSocket | null {
	if (_socket && (_socket.readyState === WebSocket.OPEN || _socket.readyState === WebSocket.CONNECTING)) {
		return _socket;
	}
	
	_socket = createSocket();
	return _socket;
}

export function useWebSocketState() {
	const [connectionState, setConnectionState] = useState(() => ({
		connected: _connected,
		socket: _socket,
		lastMessage: _lastMessage
	}));

	useEffect(() => {
		// Ensure socket is initialized
		ensureSocket();
		
		// Register for state changes
		const handleStateChange = () => {
			setConnectionState({
				connected: _connected,
				socket: _socket,
				lastMessage: _lastMessage
			});
		};
		
		_stateListeners.add(handleStateChange);
		
		// Initial state sync
		handleStateChange();
		
		return () => {
			_stateListeners.delete(handleStateChange);
		};
	}, []);

	const subscribe = useCallback((type: string, handler: (payload: any) => void) => {
		if (!_listeners.has(type)) {
			_listeners.set(type, new Set());
		}
		_listeners.get(type)!.add(handler);
		
		return () => {
			const listeners = _listeners.get(type);
			if (listeners) {
				listeners.delete(handler);
				if (listeners.size === 0) {
					_listeners.delete(type);
				}
			}
		};
	}, []);

	const publish = useCallback((type: string, payload?: any) => {
		const socket = _socket;
		if (socket && socket.readyState === WebSocket.OPEN) {
			try {
				socket.send(JSON.stringify({ type, payload }));
			} catch (error) {
				console.error('🐛 WebSocket: Failed to publish message', error);
			}
		} else {
			console.warn('⚠️ WebSocket: Cannot publish - socket not ready', { type, payload });
			// Try to reconnect if disconnected
			ensureSocket();
		}
	}, []);

	// Reconnect function for manual retry
	const reconnect = useCallback(() => {
		console.log('🔄 WebSocket: Manual reconnection requested');
		if (_reconnectTimer) {
			clearTimeout(_reconnectTimer);
			_reconnectTimer = null;
		}
		_reconnectAttempts = Math.max(0, _reconnectAttempts - 5); // Reduce penalty
		_socket = createSocket();
	}, []);

	const send = publish;
	const ready = connectionState.connected;
	const lastMessage = connectionState.lastMessage;

	return useMemo(
		() => ({ 
			connected: connectionState.connected, 
			socket: connectionState.socket, 
			subscribe, 
			publish, 
			send, 
			ready, 
			lastMessage,
			reconnect,
			reconnectAttempts: _reconnectAttempts
		}),
		[connectionState.connected, connectionState.socket, connectionState.lastMessage, subscribe, publish, send, ready, lastMessage, reconnect]
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