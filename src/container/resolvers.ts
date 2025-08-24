import type { Context } from 'hono';
import { TYPES } from './types';
import type { IUserService } from '../interfaces/user.interface';
import type { ILogger } from '../interfaces/logger.interface';
import type { IConfigService } from '../interfaces/config.interface';

// Helper function to resolve services from Hono context
export const getService = <T>(c: Context, serviceType: symbol): T => {
	const diContainer = c.get('container');
	return diContainer.get<T>(serviceType);
};

// Service resolver helpers for common services
export const getUserService = (c: Context) => {
	return getService<IUserService>(c, TYPES.UserService);
};

export const getLogger = (c: Context) => {
	return getService<ILogger>(c, TYPES.Logger);
};

export const getConfigService = (c: Context) => {
	return getService<IConfigService>(c, TYPES.ConfigService);
};
