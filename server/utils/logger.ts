import { Logger } from '../utils/logger';
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4
}

export class Logger {
  private static logLevel = LogLevel.INFO;
  private static consolidatedLogs = new Map<string, { count: number, lastLogged: number }>();
  private static consolidationWindow = 5000; // 5 seconds

  static setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  static shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  static consolidate(key: string, message: any, level: LogLevel = LogLevel.INFO) {
    if (!this.shouldLog(level)) return;

    // CRITICAL FIX: Ensure message is always a string
    const messageStr = typeof message === 'string' ? message : 
                      typeof message === 'object' ? JSON.stringify(message) : 
                      String(message || '');

    const now = Date.now();
    const existing = this.consolidatedLogs.get(key);

    if (existing && (now - existing.lastLogged) < this.consolidationWindow) {
      existing.count++;
      return;
    }

    if (existing && existing.count > 1) {
      console.log(`[CONSOLIDATED] ${messageStr} (occurred ${existing.count} times)`);
    } else {
      console.log(messageStr);
    }

    this.consolidatedLogs.set(key, { count: 1, lastLogged: now });
  }

  static info(message: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  static debug(message: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  static error(message: string, error?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, error || '');
    }
  }

  static warn(message: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }
}