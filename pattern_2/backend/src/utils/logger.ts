/**
 * Logger Utility
 *
 * Production-ready logging with different log levels and structured output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private context: string;
  private minLevel: LogLevel;

  constructor(context: string, minLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.minLevel = minLevel;
  }

  debug(message: string, ...args: any[]): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      this.log('DEBUG', message, args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.minLevel <= LogLevel.INFO) {
      this.log('INFO', message, args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.minLevel <= LogLevel.WARN) {
      this.log('WARN', message, args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.minLevel <= LogLevel.ERROR) {
      this.log('ERROR', message, args);
    }
  }

  private log(level: string, message: string, args: any[]): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      data: args.length > 0 ? args : undefined,
    };

    const formattedMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;

    switch (level) {
      case 'ERROR':
        console.error(formattedMessage, ...args);
        break;
      case 'WARN':
        console.warn(formattedMessage, ...args);
        break;
      case 'DEBUG':
        console.debug(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}
