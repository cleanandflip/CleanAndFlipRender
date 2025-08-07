import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';

let io: Server;

export function initializeWebSocket(server: HTTPServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    },
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

// Real-time cart updates
export function broadcastCartUpdate(userId: string) {
  if (io) {
    io.to(`user:${userId}`).emit('cart-updated');
    logger.info({
      type: 'websocket_broadcast',
      event: 'cart-updated',
      userId
    });
  }
}

// Real-time wishlist updates
export function broadcastWishlistUpdate(userId: string) {
  if (io) {
    io.to(`user:${userId}`).emit('wishlist-updated');
    logger.info({
      type: 'websocket_broadcast',
      event: 'wishlist-updated',
      userId
    });
  }
}

// Real-time product updates for admin
export function broadcastProductUpdate(productId: string, action: string) {
  if (io) {
    io.to('admin').emit('product-updated', { productId, action });
    io.emit('inventory-updated'); // Notify all clients about inventory changes
    logger.info({
      type: 'websocket_broadcast',
      event: 'product-updated',
      productId,
      action
    });
  }
}

// Real-time stock updates
export function broadcastStockUpdate(productId: string, newStock: number) {
  if (io) {
    io.emit('stock-updated', { productId, stock: newStock });
    logger.info({
      type: 'websocket_broadcast',
      event: 'stock-updated',
      productId,
      stock: newStock
    });
  }
}

export { io };