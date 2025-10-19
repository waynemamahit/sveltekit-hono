// Service identifiers for InversifyJS
export const TYPES = {
	// User domain services
	UserService: Symbol.for('UserService'),
	UserRepository: Symbol.for('UserRepository'),

	// Infrastructure services
	Logger: Symbol.for('Logger'),
	LoggerFactory: Symbol.for('LoggerFactory'),
	ConfigService: Symbol.for('ConfigService'),

	// Client-side services (for Svelte components)
	HttpClient: Symbol.for('HttpClient'),
	UserApiService: Symbol.for('UserApiService'),
	HealthApiService: Symbol.for('HealthApiService'),
	HelloApiService: Symbol.for('HelloApiService'),
	ApiService: Symbol.for('ApiService')
} as const;
