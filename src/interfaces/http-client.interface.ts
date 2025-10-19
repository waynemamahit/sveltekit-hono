// HTTP Client Interface for making API requests
export interface IHttpClient {
	/**
	 * Make a GET request
	 */
	get<T>(url: string, config?: RequestConfig): Promise<T>;

	/**
	 * Make a POST request
	 */
	post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;

	/**
	 * Make a PUT request
	 */
	put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;

	/**
	 * Make a PATCH request
	 */
	patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;

	/**
	 * Make a DELETE request
	 */
	delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

// Request configuration options
export interface RequestConfig {
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean>;
	timeout?: number;
	signal?: AbortSignal;
}

// HTTP Error with additional context
export class HttpError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly statusText: string,
		public readonly url: string,
		public readonly response?: unknown
	) {
		super(message);
		this.name = 'HttpError';
		Object.setPrototypeOf(this, HttpError.prototype);
	}
}
