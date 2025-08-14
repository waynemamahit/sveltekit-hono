import { dev } from '$app/environment';

/**
 * Environment variables configuration
 * This file provides type-safe access to environment variables
 */

// Client-side environment variables (prefixed with PUBLIC_)
export const PUBLIC_ENV = {
	API_BASE_URL: dev ? 'http://localhost:5173/api' : '/api',
	ENVIRONMENT: dev ? 'development' : 'production'
} as const;

// Server-side environment variables access helper
export function getServerEnv(platform: { env: { ENVIRONMENT: string } }) {
	return {
		ENVIRONMENT: platform?.env?.ENVIRONMENT || 'development'
		// Add other server-side env vars here
	};
}

// Type definitions for environment variables
export interface ServerEnv {
	ENVIRONMENT: string;
	// Add other server-side env var types here
}

export interface ClientEnv {
	API_BASE_URL: string;
	ENVIRONMENT: string;
}
