import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Cloudflare adapter with optimizations
		adapter: adapter({
			// Cloudflare Pages configuration
			pages: true,
			// Edge-side includes for better performance
			edge: false,
			// Split chunks for better caching
			split: true
		}),

		// Service worker for offline functionality (optional)
		serviceWorker: {
			register: false
		},

		// Environment variable prefix for client-side access
		env: {
			publicPrefix: 'PUBLIC_'
		}
	}
};

export default config;
