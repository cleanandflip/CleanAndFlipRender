import type { Server } from 'node:http'
import { WebSocketServer } from 'ws'

export function initWebSocket(server: Server) {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }))

    socket.on('message', (raw) => {
      // broadcast example
      for (const client of wss.clients) {
        if (client.readyState === 1) client.send(raw)
      }
    })
  })

  console.log('[ws] WebSocket server attached')
}
