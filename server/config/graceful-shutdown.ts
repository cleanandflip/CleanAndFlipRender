import { Server } from 'http';
import { closeDatabasePool } from './database';
import { closeRedisConnection } from './cache';
import { logger } from './logger';

let server: Server;

export function registerGracefulShutdown(httpServer: Server) {
  server = httpServer;
  
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
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
  
  // Close database connections
  try {
    await closeDatabasePool();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }
  
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