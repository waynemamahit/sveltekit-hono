import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConfigService } from '../../services/config.service';

// We simulate environment by temporarily assigning to globalThis.process.env where available

describe('ConfigService', () => {
	let originalEnv: Record<string, string | undefined> | undefined;

	beforeEach(() => {
		// Snapshot baseline
		if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
			const globalWithProcess = globalThis as typeof globalThis & {
				process: { env: Record<string, string | undefined> };
			};
			originalEnv = { ...globalWithProcess.process?.env };
			// Clear relevant keys to test defaults first
			globalWithProcess.process.env = {};
		}
	});

	it('should return default app and database config when env is empty', () => {
		const svc = new ConfigService();
		const app = svc.getAppConfig();
		const db = svc.getDatabaseConfig();

		expect(app).toEqual({ port: 3000, environment: 'development', apiVersion: '1.0.0' });
		expect(db).toEqual({ url: 'sqlite://memory', maxConnections: 10, timeout: 30000 });
	});

	it('should parse numeric env vars and fall back to defaults on missing', () => {
		if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
			const globalWithProcess = globalThis as typeof globalThis & {
				process: { env: Record<string, string | undefined> };
			};
			globalWithProcess.process.env = {
				PORT: '8080',
				NODE_ENV: 'production',
				API_VERSION: '2.3.4',
				DATABASE_URL: 'postgres://localhost/db',
				DB_MAX_CONNECTIONS: '25',
				DB_TIMEOUT: '45000'
			};
		}

		const svc = new ConfigService();
		const app = svc.getAppConfig();
		const db = svc.getDatabaseConfig();

		expect(app).toEqual({ port: 8080, environment: 'production', apiVersion: '2.3.4' });
		expect(db).toEqual({ url: 'postgres://localhost/db', maxConnections: 25, timeout: 45000 });
	});

	it('should handle environment without process object', () => {
		// Temporarily remove process to test fallback
		const globalWithProcess = globalThis as typeof globalThis & {
			process?: { env: Record<string, string | undefined> };
		};
		const originalProcess = globalWithProcess.process;
		delete globalWithProcess.process;

		const svc = new ConfigService();
		const app = svc.getAppConfig();
		const db = svc.getDatabaseConfig();

		expect(app).toEqual({ port: 3000, environment: 'development', apiVersion: '1.0.0' });
		expect(db).toEqual({ url: 'sqlite://memory', maxConnections: 10, timeout: 30000 });

		// Restore
		if (originalProcess) {
			globalWithProcess.process = originalProcess;
		}
	});

	it('should handle process object with null env property', () => {
		// Test the fallback when processObj.env is null/undefined
		const globalWithProcess = globalThis as typeof globalThis & {
			process: { env: Record<string, string | undefined> | null };
		};
		const originalProcess = globalWithProcess.process;

		// Set process.env to null to trigger the || {} fallback
		globalWithProcess.process = { env: null };

		const svc = new ConfigService();
		const app = svc.getAppConfig();
		const db = svc.getDatabaseConfig();

		expect(app).toEqual({ port: 3000, environment: 'development', apiVersion: '1.0.0' });
		expect(db).toEqual({ url: 'sqlite://memory', maxConnections: 10, timeout: 30000 });

		// Restore
		globalWithProcess.process = originalProcess;
	});

	afterEach(() => {
		// Restore environment
		if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
			const globalWithProcess = globalThis as typeof globalThis & {
				process: { env: Record<string, string | undefined> };
			};
			globalWithProcess.process.env = originalEnv ?? {};
		}
	});
});
