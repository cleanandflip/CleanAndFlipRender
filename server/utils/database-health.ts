import { Logger } from './logger';

// Database connection health monitoring and diagnostic utilities
export class DatabaseHealthMonitor {
  private static lastHealthCheck: Date | null = null;
  private static isHealthy: boolean = false;
  
  // Enhanced database connection diagnostics
  static async runConnectionDiagnostics(): Promise<void> {
    Logger.info('[DB-DIAGNOSTIC] Running comprehensive database diagnostics...');
    
    // Check environment variables
    this.checkEnvironmentVariables();
    
    // Check DATABASE_URL format
    this.validateDatabaseUrl();
    
    // Test network connectivity
    await this.testNetworkConnectivity();
  }
  
  private static checkEnvironmentVariables(): void {
    const requiredVars = ['DATABASE_URL', 'NODE_ENV'];
    const optionalVars = ['REDIS_URL', 'STRIPE_SECRET_KEY'];
    
    Logger.info('[DB-DIAGNOSTIC] Checking environment variables...');
    
    for (const varName of requiredVars) {
      const exists = !!process.env[varName];
      Logger.info(`[DB-DIAGNOSTIC] ${varName}: ${exists ? '✅ SET' : '❌ MISSING'}`);
      
      if (!exists && varName === 'DATABASE_URL') {
        Logger.error('[DB-DIAGNOSTIC] CRITICAL: DATABASE_URL is required');
      }
    }
    
    for (const varName of optionalVars) {
      const exists = !!process.env[varName];
      Logger.info(`[DB-DIAGNOSTIC] ${varName}: ${exists ? '✅ SET' : '⚠️ NOT SET'}`);
    }
  }
  
  private static validateDatabaseUrl(): void {
    Logger.info('[DB-DIAGNOSTIC] Validating DATABASE_URL format...');
    
    if (!process.env.DATABASE_URL) {
      Logger.error('[DB-DIAGNOSTIC] DATABASE_URL is not set');
      return;
    }
    
    try {
      const url = new URL(process.env.DATABASE_URL);
      
      Logger.info(`[DB-DIAGNOSTIC] Protocol: ${url.protocol}`);
      Logger.info(`[DB-DIAGNOSTIC] Host: ${url.hostname}`);
      Logger.info(`[DB-DIAGNOSTIC] Port: ${url.port || 'default'}`);
      Logger.info(`[DB-DIAGNOSTIC] Database: ${url.pathname.substring(1)}`);
      Logger.info(`[DB-DIAGNOSTIC] Username: ${url.username || 'not specified'}`);
      Logger.info(`[DB-DIAGNOSTIC] Password: ${url.password ? '✅ SET' : '❌ MISSING'}`);
      
      // Check SSL mode
      const sslMode = url.searchParams.get('sslmode');
      Logger.info(`[DB-DIAGNOSTIC] SSL Mode: ${sslMode || 'not specified'}`);
      
      // Validate required components
      if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
        Logger.error('[DB-DIAGNOSTIC] Invalid protocol. Expected postgresql:// or postgres://');
      }
      
      if (!url.hostname.includes('neon.tech')) {
        Logger.warn('[DB-DIAGNOSTIC] Host does not appear to be a Neon database');
      }
      
      if (!url.username) {
        Logger.error('[DB-DIAGNOSTIC] Username is missing from connection string');
      }
      
      if (!url.password) {
        Logger.error('[DB-DIAGNOSTIC] Password is missing from connection string');
      }
      
    } catch (error) {
      Logger.error('[DB-DIAGNOSTIC] Invalid DATABASE_URL format:', error);
    }
  }
  
  private static async testNetworkConnectivity(): Promise<void> {
    Logger.info('[DB-DIAGNOSTIC] Testing network connectivity...');
    
    if (!process.env.DATABASE_URL) {
      Logger.error('[DB-DIAGNOSTIC] Cannot test connectivity without DATABASE_URL');
      return;
    }
    
    try {
      const url = new URL(process.env.DATABASE_URL);
      const hostname = url.hostname;
      
      // Test DNS resolution
      const { lookup } = await import('dns').then(dns => ({
        lookup: (hostname: string) => new Promise((resolve, reject) => {
          dns.lookup(hostname, (err, address) => {
            if (err) reject(err);
            else resolve(address);
          });
        })
      }));
      
      const address = await lookup(hostname);
      Logger.info(`[DB-DIAGNOSTIC] DNS Resolution: ${hostname} → ${address} ✅`);
      
    } catch (error: any) {
      Logger.error('[DB-DIAGNOSTIC] Network connectivity test failed:', error.message);
    }
  }
  
  // Mark health check status
  static updateHealthStatus(isHealthy: boolean): void {
    this.isHealthy = isHealthy;
    this.lastHealthCheck = new Date();
    
    Logger.info(`[DB-HEALTH] Status updated: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} at ${this.lastHealthCheck.toISOString()}`);
  }
  
  // Get current health status
  static getHealthStatus(): { isHealthy: boolean; lastCheck: Date | null } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastHealthCheck
    };
  }
}

// Export utility functions
export const runDatabaseDiagnostics = DatabaseHealthMonitor.runConnectionDiagnostics.bind(DatabaseHealthMonitor);
export const updateDatabaseHealth = DatabaseHealthMonitor.updateHealthStatus.bind(DatabaseHealthMonitor);
export const getDatabaseHealth = DatabaseHealthMonitor.getHealthStatus.bind(DatabaseHealthMonitor);