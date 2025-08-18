import { createDatabaseConnection, validateDatabaseEnvironment } from '../config/database';

// Global database connection
let dbConnection: any = null;

/**
 * Get or create database connection
 */
export async function getDatabase() {
  if (!dbConnection) {
    dbConnection = await createDatabaseConnection();
  }
  return dbConnection;
}

/**
 * Initialize database system
 */
export async function initializeDatabase() {
  try {
    await validateDatabaseEnvironment();
    const connection = await getDatabase();
    
    console.log('[DB] Database system initialized successfully');
    return connection;
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (dbConnection) {
    // Neon HTTP connections don't need explicit closing
    dbConnection = null;
    console.log('[DB] Database connection closed');
  }
}

// Export for use in other modules
export { createDatabaseConnection, validateDatabaseEnvironment };