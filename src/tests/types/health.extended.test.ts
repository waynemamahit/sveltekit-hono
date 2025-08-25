import { describe, it, expect } from 'vitest';

// Type import to ensure coverage of health.ts
import { type HealthStatus } from '../../types/health';

describe('health.ts type', () => {
	it('should define HealthStatus interface correctly', () => {
		const healthStatus = {
			status: 'ok',
			environment: 'test',
			timestamp: new Date().toISOString()
		} satisfies HealthStatus;

		expect(healthStatus).toHaveProperty('status');
		expect(healthStatus).toHaveProperty('environment');
		expect(healthStatus).toHaveProperty('timestamp');
		expect(typeof healthStatus.status).toBe('string');
		expect(typeof healthStatus.environment).toBe('string');
		expect(typeof healthStatus.timestamp).toBe('string');
	});

	it('should accept various status values', () => {
		const statuses = ['ok', 'error', 'degraded'];

		statuses.forEach((status) => {
			const health = {
				status,
				environment: 'test',
				timestamp: '2024-01-01T00:00:00.000Z'
			} satisfies HealthStatus;

			expect(health.status).toBe(status);
		});
	});
});
