import type { MockedFunction } from 'vitest';

/**
 * Mock API responses for fetch calls
 * Used in API tests for mocking HTTP requests
 */
export class MockAPI {
	private static fetchMock = global.fetch as MockedFunction<typeof fetch>;

	/**
	 * Mock a successful API response
	 */
	static mockSuccess(data: unknown, status = 200): void {
		this.fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(data), {
				status,
				headers: { 'Content-Type': 'application/json' }
			})
		);
	}

	/**
	 * Mock an API error response
	 */
	static mockError(message = 'API Error', status = 500): void {
		this.fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ error: message }), {
				status,
				headers: { 'Content-Type': 'application/json' }
			})
		);
	}

	/**
	 * Reset all fetch mocks
	 */
	static reset(): void {
		this.fetchMock.mockClear();
	}
}
