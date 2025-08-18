import { useState, useEffect } from 'react';
import { useWebSocketState } from '@/hooks/useWebSocketState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';

export function WebSocketDiagnostics() {
  const { ready, connected, reconnect, reconnectAttempts, lastMessage, publish } = useWebSocketState();
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: string;
    status: 'connected' | 'disconnected';
  }>>([]);
  const [messageCount, setMessageCount] = useState(0);

  // Track connection state changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    setConnectionHistory(prev => [
      ...prev.slice(-9), // Keep last 10 entries
      {
        timestamp,
        status: connected ? 'connected' : 'disconnected'
      }
    ]);
  }, [connected]);

  // Track incoming messages
  useEffect(() => {
    if (lastMessage) {
      setMessageCount(prev => prev + 1);
    }
  }, [lastMessage]);

  const sendTestMessage = () => {
    publish('test:message', { 
      timestamp: new Date().toISOString(),
      test: 'diagnostics' 
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          WebSocket Live Sync Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {ready ? (
                <Wifi className="w-4 h-4 text-emerald-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">
                Connection Status
              </span>
              <Badge variant={ready ? "default" : "destructive"}>
                {ready ? "Active" : "Disconnected"}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Messages Received</span>
              <Badge variant="outline">{messageCount}</Badge>
            </div>
          </div>
        </div>

        {/* Reconnection Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Reconnection Attempts:</span>
            <Badge variant="outline">{reconnectAttempts}</Badge>
          </div>
          
          <Button 
            onClick={reconnect}
            disabled={ready}
            size="sm"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Force Reconnect
          </Button>
        </div>

        {/* Test Message */}
        <div className="space-y-2">
          <Button 
            onClick={sendTestMessage}
            disabled={!ready}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Send Test Message
          </Button>
        </div>

        {/* Last Message */}
        {lastMessage && (
          <div className="space-y-2">
            <span className="font-medium">Last Message:</span>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs">
              <div><strong>Type:</strong> {lastMessage.type}</div>
              <div><strong>Payload:</strong> {JSON.stringify(lastMessage.payload, null, 2)}</div>
            </div>
          </div>
        )}

        {/* Connection History */}
        <div className="space-y-2">
          <span className="font-medium">Recent Connection Events:</span>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {connectionHistory.slice(-5).reverse().map((event, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge 
                  variant={event.status === 'connected' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {event.status}
                </Badge>
                <span className="text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}