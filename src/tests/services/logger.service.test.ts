import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { Logger, LoggerFactory } from '../../services/logger.service';

// Helper to parse JSON log lines
function parseLog(line: string) {
	return JSON.parse(line) as {
		timestamp: string;
		level: string;
		context: string;
		message: string;
		meta?: Record<string, unknown>;
	};
}

describe('Logger', () => {
	const original = {
		log: console.log,
		warn: console.warn,
		error: console.error,
		debug: console.debug
	};

	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'debug').mockImplementation(() => {});
	});

	it('info should print structured log with context and meta', () => {
		const logger = new Logger('API');
		logger.info('hello', { userId: 1 });
		expect(console.log).toHaveBeenCalledTimes(1);
		const mockLog = vi.mocked(console.log);
		const call = mockLog.mock.calls[0][0] as string;
		const parsed = parseLog(call);
		expect(parsed.level).toBe('INFO');
		expect(parsed.context).toBe('API');
		expect(parsed.message).toBe('hello');
		expect(parsed.meta).toEqual({ userId: 1 });
	});

	it('warn should print structured warning', () => {
		const logger = new Logger('API');
		logger.warn('be careful');
		expect(console.warn).toHaveBeenCalledTimes(1);
		const mockWarn = vi.mocked(console.warn);
		const parsed = parseLog(mockWarn.mock.calls[0][0]);
		expect(parsed.level).toBe('WARN');
		expect(parsed.message).toBe('be careful');
	});

	it('error should include error details when provided', () => {
		const logger = new Logger('API');
		const err = new Error('boom');
		logger.error('failed', err, { id: 42 });
		expect(console.error).toHaveBeenCalledTimes(1);
		const mockError = vi.mocked(console.error);
		const parsed = parseLog(mockError.mock.calls[0][0]);
		expect(parsed.level).toBe('ERROR');
		expect(parsed.message).toBe('failed');
		expect(parsed.meta).toMatchObject({ error: 'boom' });
	});

	it('debug should print structured debug', () => {
		const logger = new Logger('API');
		logger.debug('details', { flag: true });
		expect(console.debug).toHaveBeenCalledTimes(1);
		const mockDebug = vi.mocked(console.debug);
		const parsed = parseLog(mockDebug.mock.calls[0][0]);
		expect(parsed.level).toBe('DEBUG');
		expect(parsed.meta).toEqual({ flag: true });
	});

	it('LoggerFactory should create loggers with given context', () => {
		const factory = new LoggerFactory();
		const apiLogger = factory.createLogger('API');
		apiLogger.info('x');
		expect(console.log).toHaveBeenCalledTimes(1);
		const mockLog = vi.mocked(console.log);
		const parsed = parseLog(mockLog.mock.calls[0][0]);
		expect(parsed.context).toBe('API');
	});

	afterAll(() => {
		console.log = original.log;
		console.warn = original.warn;
		console.error = original.error;
		console.debug = original.debug;
	});
});
