import { injectable } from 'inversify';
import type { IConfigService, IAppConfig, IDatabaseConfig } from '../interfaces/config.interface';

// Single Responsibility Principle - Only handles configuration
@injectable()
export class ConfigService implements IConfigService {
	getAppConfig(): IAppConfig {
		// Safe environment variable access for edge runtimes
		const env = this.getEnvironmentVariables();
		return {
			port: parseInt(env.PORT || '3000'),
			environment: env.NODE_ENV || 'development',
			apiVersion: env.API_VERSION || '1.0.0'
		};
	}

	getDatabaseConfig(): IDatabaseConfig {
		const env = this.getEnvironmentVariables();
		return {
			url: env.DATABASE_URL || 'sqlite://memory',
			maxConnections: parseInt(env.DB_MAX_CONNECTIONS || '10'),
			timeout: parseInt(env.DB_TIMEOUT || '30000')
		};
	}

	private getEnvironmentVariables(): Record<string, string | undefined> {
		// Safe way to access environment variables across different runtimes
		if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
			const processObj = (globalThis as Record<string, unknown>).process;
			if (processObj && typeof processObj === 'object' && 'env' in processObj) {
				return (processObj.env as Record<string, string | undefined>) || {};
			}
		}
		return {};
	}
}
