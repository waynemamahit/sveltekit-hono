// Service identifiers for InversifyJS
export const TYPES = {
	// User domain services
	UserService: Symbol.for('UserService'),
	UserRepository: Symbol.for('UserRepository'),

	// Infrastructure services
	Logger: Symbol.for('Logger'),
	LoggerFactory: Symbol.for('LoggerFactory'),
	ConfigService: Symbol.for('ConfigService')
} as const;
