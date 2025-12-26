/**
 * Logger
 * Comprehensive logging and monitoring system
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigManager } from '../config/config-manager.js';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.logger = this.createLogger();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Create Winston logger instance
   */
  private createLogger(): winston.Logger {
    const config = this.configManager.getConfig();
    const logDir = join(process.cwd(), '.bitdap', 'logs');

    // Ensure log directory exists
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        level: config.logging.level,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            let log = `${timestamp} [${level}]: ${message}`;
            if (Object.keys(meta).length > 0) {
              log += ` ${JSON.stringify(meta)}`;
            }
            return log;
          })
        )
      })
    ];

    // File transport with rotation
    if (config.logging.rotation) {
      transports.push(
        new DailyRotateFile({
          filename: join(logDir, 'bitdap-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: config.logging.level,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      // Separate error log
      transports.push(
        new DailyRotateFile({
          filename: join(logDir, 'bitdap-error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    // Single file transport if specified
    if (config.logging.file && !config.logging.rotation) {
      transports.push(
        new winston.transports.File({
          filename: config.logging.file,
          level: config.logging.level,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    return winston.createLogger({
      level: config.logging.level,
      transports,
      exitOnError: false
    });
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log info message
   */
  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Log warning message
   */
  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log error message
   */
  public error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * Log transaction start
   */
  public logTransactionStart(operation: string, params: any): void {
    this.info(`Transaction started: ${operation}`, {
      operation,
      parameters: this.sanitizeParams(params),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log transaction completion
   */
  public logTransactionComplete(operation: string, result: any): void {
    this.info(`Transaction completed: ${operation}`, {
      operation,
      success: result.success,
      txId: result.txId,
      gasUsed: result.gasUsed,
      fee: result.fee,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log transaction failure
   */
  public logTransactionFailure(operation: string, error: any): void {
    this.error(`Transaction failed: ${operation}`, {
      operation,
      error: {
        code: error.code,
        message: error.message,
        category: error.category
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log command execution
   */
  public logCommandExecution(command: string, args: any): void {
    this.info(`Command executed: ${command}`, {
      command,
      arguments: this.sanitizeParams(args),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log configuration changes
   */
  public logConfigChange(changes: any): void {
    this.info('Configuration updated', {
      changes: this.sanitizeParams(changes),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log wallet operations
   */
  public logWalletOperation(operation: string, address: string, meta?: any): void {
    this.info(`Wallet operation: ${operation}`, {
      operation,
      address,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log network operations
   */
  public logNetworkOperation(operation: string, network: string, meta?: any): void {
    this.info(`Network operation: ${operation}`, {
      operation,
      network,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log batch operations
   */
  public logBatchOperation(operation: string, batchSize: number, results: any): void {
    this.info(`Batch operation: ${operation}`, {
      operation,
      batchSize,
      successful: results.successful,
      failed: results.failed,
      executionTime: results.executionTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log performance metrics
   */
  public logPerformanceMetric(operation: string, duration: number, meta?: any): void {
    this.debug(`Performance: ${operation}`, {
      operation,
      duration,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', meta?: any): void {
    const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    
    this.logger.log(logLevel, `Security event: ${event}`, {
      event,
      severity,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sanitize parameters to remove sensitive data
   */
  private sanitizeParams(params: any): any {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const sanitized = { ...params };
    const sensitiveKeys = ['private-key', 'privateKey', 'key', 'secret', 'password'];

    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Create child logger with context
   */
  public createChildLogger(context: string): winston.Logger {
    return this.logger.child({ context });
  }

  /**
   * Get log statistics
   */
  public getLogStats(): any {
    // This would return statistics about log entries
    // For now, return basic info
    return {
      logLevel: this.configManager.getConfig().logging.level,
      rotationEnabled: this.configManager.getConfig().logging.rotation,
      logDirectory: join(process.cwd(), '.bitdap', 'logs')
    };
  }

  /**
   * Update logger configuration
   */
  public updateConfiguration(): void {
    // Recreate logger with new configuration
    this.logger.close();
    this.logger = this.createLogger();
  }

  /**
   * Export metrics for external monitoring
   */
  public exportMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      logLevel: this.configManager.getConfig().logging.level,
      transports: this.logger.transports.length,
      // Add more metrics as needed
    };
  }

  /**
   * Flush all log transports
   */
  public async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }

  /**
   * Set up structured logging for operations
   */
  public withOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substr(2, 9);
    
    this.info(`Operation started: ${operation}`, { operationId, operation });
    
    return fn()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.info(`Operation completed: ${operation}`, { 
          operationId, 
          operation, 
          duration,
          success: true 
        });
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.error(`Operation failed: ${operation}`, { 
          operationId, 
          operation, 
          duration,
          error: error.message,
          success: false 
        });
        throw error;
      });
  }
}