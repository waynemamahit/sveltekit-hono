import { injectable } from 'inversify';
import type { ILogger, ILoggerFactory } from '../interfaces/logger.interface';

// Single Responsibility Principle - Only handles logging
@injectable()
export class Logger implements ILogger {
	constructor(private readonly context: string = 'App') {}

	info(message: string, meta?: Record<string, unknown>): void {
		const logEntry = this.formatLog('INFO', message, meta);
		console.log(logEntry);
	}

	warn(message: string, meta?: Record<string, unknown>): void {
		const logEntry = this.formatLog('WARN', message, meta);
		console.warn(logEntry);
	}

	error(message: string, error?: Error, meta?: Record<string, unknown>): void {
		const logEntry = this.formatLog('ERROR', message, {
			...meta,
			error: error?.message,
			stack: error?.stack
		});
		console.error(logEntry);
	}

	debug(message: string, meta?: Record<string, unknown>): void {
		// Only show debug logs in development mode
		// For edge runtimes, we skip the environment check and just log
		const logEntry = this.formatLog('DEBUG', message, meta);
		console.debug(logEntry);
	}

	private formatLog(level: string, message: string, meta?: Record<string, unknown>): string {
		const timestamp = new Date().toISOString();
		const logObject = {
			timestamp,
			level,
			context: this.context,
			message,
			...(meta && Object.keys(meta).length > 0 ? { meta } : {})
		};
		return JSON.stringify(logObject);
	}
}

@injectable()
export class LoggerFactory implements ILoggerFactory {
	createLogger(context: string): ILogger {
		return new Logger(context);
	}
}
