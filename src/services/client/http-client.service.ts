import { injectable } from 'inversify';
import type { IHttpClient, RequestConfig } from '../../interfaces/http-client.interface';
import { HttpError } from '../../interfaces/http-client.interface';

@injectable()
export class HttpClient implements IHttpClient {
	private readonly baseURL: string;
	private readonly defaultHeaders: Record<string, string>;

	constructor(baseURL: string = '', defaultHeaders: Record<string, string> = {}) {
		this.baseURL = baseURL;
		this.defaultHeaders = {
			'Content-Type': 'application/json',
			...defaultHeaders
		};
	}

	async get<T>(url: string, config?: RequestConfig): Promise<T> {
		return this.request<T>('GET', url, undefined, config);
	}

	async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request<T>('POST', url, data, config);
	}

	async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request<T>('PUT', url, data, config);
	}

	async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
		return this.request<T>('PATCH', url, data, config);
	}

	async delete<T>(url: string, config?: RequestConfig): Promise<T> {
		return this.request<T>('DELETE', url, undefined, config);
	}

	private async request<T>(
		method: string,
		url: string,
		data?: unknown,
		config?: RequestConfig
	): Promise<T> {
		const fullUrl = this.buildUrl(url, config?.params);

		const headers = {
			...this.defaultHeaders,
			...config?.headers
		};

		const requestInit: RequestInit = {
			method,
			headers,
			signal: config?.signal
		};

		if (data !== undefined && method !== 'GET' && method !== 'DELETE') {
			requestInit.body = JSON.stringify(data);
		}

		try {
			const response = await fetch(fullUrl, requestInit);

			if (!response.ok) {
				await this.handleErrorResponse(response, fullUrl);
			}

			// Handle empty responses (like 204 No Content)
			if (response.status === 204 || response.headers.get('content-length') === '0') {
				return {} as T;
			}

			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				return await response.json();
			}

			// If not JSON, return text as fallback
			const text = await response.text();
			return text as unknown as T;
		} catch (error) {
			if (error instanceof HttpError) {
				throw error;
			}

			// Handle network errors, timeouts, etc.
			throw new Error(
				`Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
		const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

		if (!params || Object.keys(params).length === 0) {
			return fullUrl;
		}

		const urlObj = new URL(fullUrl, window.location.origin);
		Object.entries(params).forEach(([key, value]) => {
			urlObj.searchParams.append(key, String(value));
		});

		return urlObj.toString();
	}

	private async handleErrorResponse(response: Response, url: string): Promise<never> {
		let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
		let responseData: unknown;

		try {
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				responseData = await response.json();
				// Try to extract error message from common API response formats
				if (responseData && typeof responseData === 'object') {
					const data = responseData as Record<string, unknown>;
					errorMessage =
						(data.error as string) ||
						(data.message as string) ||
						(data.detail as string) ||
						errorMessage;
				}
			} else {
				responseData = await response.text();
				if (typeof responseData === 'string' && responseData.length > 0) {
					errorMessage = responseData;
				}
			}
		} catch {
			// If we can't parse the error response, use the default message
		}

		throw new HttpError(errorMessage, response.status, response.statusText, url, responseData);
	}
}
