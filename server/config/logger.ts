import winston from "winston";
import * as path from "path";
import * as fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// ANSI color codes (no external dependency needed)
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
};

// Log profiles
interface LogProfile {
  requests: boolean;
  auth: boolean;
  database: boolean;
  cache: boolean;
  errors: boolean;
  performance: boolean;
  [key: string]: boolean;
}

const logProfiles: Record<string, LogProfile> = {
  development: {
    requests: true,
    auth: true,
    database: false,
    cache: false,
    errors: true,
    performance: true,
  },
  production: {
    requests: false,
    auth: false,
    database: false,
    cache: false,
    errors: true,
    performance: true,
  },
  debug: {
    requests: true,
    auth: true,
    database: true,
    cache: true,
    errors: true,
    performance: true,
  },
};

const currentProfile =
  logProfiles[
    process.env.LOG_PROFILE || process.env.NODE_ENV || "development"
  ] || logProfiles.development;

export function shouldLog(category: string): boolean {
  return currentProfile[category] ?? false;
}

// Track to prevent duplicate logs
const loggedOnce = new Set<string>();

// Custom format without chalk
const customFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }: any) => {
    const messageStr =
      typeof message === "string" ? message : JSON.stringify(message);

    // Skip duplicate connection logs
    const logKey = `${level}:${messageStr}`;
    if (messageStr?.includes("connected successfully")) {
      if (loggedOnce.has(logKey)) return "";
      loggedOnce.add(logKey);
    }

    // Skip noisy logs
    if (messageStr?.includes("Redis connection error") && !shouldLog("cache"))
      return "";
    if (messageStr?.includes("Keep-alive") && !shouldLog("database")) return "";

    const time = new Date(timestamp).toLocaleTimeString();

    // Format based on log type
    if (metadata.type === "request") {
      const { method, url, status, duration } = metadata;
      const statusColor =
        status >= 400
          ? colors.red
          : status >= 300
            ? colors.yellow
            : colors.green;
      return `${colors.gray}${time}${colors.reset} ${colors.cyan}${String(method).padEnd(7)}${colors.reset} ${String(url).padEnd(40)} ${statusColor}${status}${colors.reset} ${colors.gray}${duration}ms${colors.reset}`;
    }

    if (metadata.type === "auth") {
      return `${colors.gray}${time}${colors.reset} ${colors.blue}[AUTH]${colors.reset} ${messageStr}`;
    }

    if (metadata.type === "system") {
      const icon = level === "error" ? "❌" : level === "warn" ? "⚠️" : "✅";
      return `${colors.gray}${time}${colors.reset} ${icon} ${messageStr}`;
    }

    // Default format
    const levelColor =
      level === "error"
        ? colors.red
        : level === "warn"
          ? colors.yellow
          : level === "info"
            ? colors.green
            : colors.gray;

    return `${colors.gray}${time}${colors.reset} ${levelColor}${level}${colors.reset}: ${messageStr}`;
  },
);

// Simple format for production (no colors)
const simpleFormat = winston.format.printf(
  ({ level, message, timestamp }: any) => {
    const messageStr =
      typeof message === "string" ? message : JSON.stringify(message);
    return `[${timestamp}] ${level.toUpperCase()}: ${messageStr}`;
  },
);

// Create logger
export const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }),
    process.env.NODE_ENV === "production" ? simpleFormat : customFormat,
  ),
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production" ? simpleFormat : customFormat,
    }),
    // File transports for production
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, "error.log"),
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: simpleFormat,
          }),
          new winston.transports.File({
            filename: path.join(logsDir, "combined.log"),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            format: simpleFormat,
          }),
        ]
      : []),
  ],
});

// Request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  // Skip static files and health checks
  if (
    req.url.includes(".") ||
    req.url === "/health" ||
    req.url === "/favicon.ico" ||
    req.url.startsWith("/@") || // Vite HMR
    req.url.startsWith("/node_modules")
  ) {
    return next();
  }

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Skip fast successful requests in production
    if (
      process.env.NODE_ENV === "production" &&
      duration < 1000 &&
      res.statusCode < 400
    ) {
      return;
    }

    // Skip in development if disabled
    if (!shouldLog("requests") && res.statusCode < 400 && duration < 500) {
      return;
    }

    logger.http("Request", {
      type: "request",
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
    });

    // Warn about slow requests
    const slowThreshold = parseInt(process.env.LOG_SLOW_REQUESTS || "1000");
    if (duration > slowThreshold) {
      logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
  });

  next();
};

// Simplified Logger class for backward compatibility
export class Logger {
  static info(message: string, ...args: any[]) {
    logger.info(message, ...args);
  }

  static error(message: string, ...args: any[]) {
    logger.error(message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    logger.warn(message, ...args);
  }

  static debug(message: string, ...args: any[]) {
    logger.debug(message, ...args);
  }

  static http(message: string, metadata?: any) {
    logger.http(message, metadata);
  }

  static consolidate(key: string, message: string, level: string = 'debug') {
    // Simple consolidation - just log with debug level
    logger.debug(`[CONSOLIDATED:${key}] ${message}`);
  }
}

// Export for convenience
export default logger;
