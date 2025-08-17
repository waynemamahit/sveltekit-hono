import '@testing-library/jest-dom/vitest';
import { beforeEach, vi } from 'vitest';

// Mock fetch globally for API tests
global.fetch = vi.fn();

// Global test setup
beforeEach(() => {
	// Reset all mocks before each test
	vi.clearAllMocks();
});
