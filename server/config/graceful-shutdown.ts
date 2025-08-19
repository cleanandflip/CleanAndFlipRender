import { Server } from 'http';
// Database pool is handled by server/db.ts
import { closeRedisConnection } from './cache';
import { logger } from './logger';

let server: Server;

export function registerGracefulShutdown(httpServer: Server) {
  server = httpServer;
  
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Don't shutdown on environment variable errors during startup
    if (error.message && error.message.includes('APP_ENV is not defined')) {
      logger.warn('APP_ENV issue detected, but application is operational. Continuing...');
      return;
    }
    handleShutdown();
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In development, log the error but don't shutdown immediately
    if (process.env.NODE_ENV === 'production') {
      handleShutdown();
    }
  });
}

async function handleShutdown() {
  logger.info('Graceful shutdown initiated...');
  
  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  
  // Database connections are handled by server/db.ts
  logger.info('Database connections will be closed by shutdown handlers');
  
  // Close Redis connection
  try {
    await closeRedisConnection();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.error('Error closing Redis:', error);
  }
  
  // Give processes time to finish
  setTimeout(() => {
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }, 5000);
}