import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';

let io: Server;

export function initializeWebSocket(server: HTTPServer) {
  io = new Server(server, {
    cors: { origin: true, credentials: true },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    logger.info({
      type: 'websocket_connection',
      socketId: socket.id,
      ip: socket.handshake.address
    });

    // Join user-specific room for real-time updates
    socket.on('join-user-room', (userId: string) => {
      if (userId && typeof userId === 'string') {
        socket.join(`user:${userId}`);
        logger.info({
          type: 'websocket_join_room',
          socketId: socket.id,
          userId,
          room: `user:${userId}`
        });
      }
    });

    // Join admin room for real-time admin updates
    socket.on('join-admin-room', (userId: string) => {
      if (userId && typeof userId === 'string') {
        socket.join('admin');
        logger.info({
          type: 'websocket_join_admin',
          socketId: socket.id,
          userId
        });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info({
        type: 'websocket_disconnect',
        socketId: socket.id,
        reason
      });
    });
  });

  return io;
}

// Legacy WebSocket functions have been replaced by the new typed WebSocket system

export { io };