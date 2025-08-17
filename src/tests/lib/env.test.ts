import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUBLIC_ENV, getServerEnv, type ServerEnv, type ClientEnv } from '$lib/env';

// Mock the SvelteKit environment
vi.mock('$app/environment', () => ({
	dev: false
}));

describe('Environment Configuration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('PUBLIC_ENV', () => {
		it('should provide correct production configuration', () => {
			expect(PUBLIC_ENV.API_BASE_URL).toBe('/api');
			expect(PUBLIC_ENV.ENVIRONMENT).toBe('production');
		});
	});

	describe('getServerEnv', () => {
		it('should return environment from platform object', () => {
			const platform = {
				env: {
					ENVIRONMENT: 'production'
				}
			};

			const result = getServerEnv(platform);
			expect(result.ENVIRONMENT).toBe('production');
		});

		it('should return default environment when platform is undefined', () => {
			const result = getServerEnv({} as unknown as { env: { ENVIRONMENT: string } });
			expect(result.ENVIRONMENT).toBe('development');
		});

		it('should return default environment when platform.env is undefined', () => {
			const platform = { env: undefined as unknown as { ENVIRONMENT: string } };
			const result = getServerEnv(platform);
			expect(result.ENVIRONMENT).toBe('development');
		});

		it('should handle null platform gracefully', () => {
			const result = getServerEnv(null as unknown as { env: { ENVIRONMENT: string } });
			expect(result.ENVIRONMENT).toBe('development');
		});
	});

	describe('Type Definitions', () => {
		it('should have correct ServerEnv interface', () => {
			const serverEnv: ServerEnv = {
				ENVIRONMENT: 'test'
			};
			expect(serverEnv).toHaveProperty('ENVIRONMENT');
		});

		it('should have correct ClientEnv interface', () => {
			const clientEnv: ClientEnv = {
				API_BASE_URL: '/api',
				ENVIRONMENT: 'test'
			};
			expect(clientEnv).toHaveProperty('API_BASE_URL');
			expect(clientEnv).toHaveProperty('ENVIRONMENT');
		});
	});
});

describe('Development Environment', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('should provide correct development configuration', async () => {
		// Mock dev environment
		vi.doMock('$app/environment', () => ({
			dev: true
		}));

		const { PUBLIC_ENV } = await import('$lib/env');
		expect(PUBLIC_ENV.API_BASE_URL).toBe('http://localhost:5173/api');
		expect(PUBLIC_ENV.ENVIRONMENT).toBe('development');
	});
});
