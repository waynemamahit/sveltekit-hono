// Configuration interface following Interface Segregation
export interface IAppConfig {
	port: number;
	environment: string;
	apiVersion: string;
}

export interface IDatabaseConfig {
	url: string;
	maxConnections: number;
	timeout: number;
}

export interface IConfigService {
	getAppConfig(): IAppConfig;
	getDatabaseConfig(): IDatabaseConfig;
}
