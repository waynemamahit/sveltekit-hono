import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Container } from 'inversify';
import { TYPES } from '../../container/types';
import { getService, getUserService, getLogger, getConfigService } from '../../container/resolvers';
import type { IUserService } from '../../interfaces/user.interface';
import type { ILogger } from '../../interfaces/logger.interface';
import type { IConfigService } from '../../interfaces/config.interface';

class FakeUserService implements IUserService {
	async getUserById() {
		return null;
	}
	async getAllUsers() {
		return [];
	}
	async createUser() {
		return { id: 1, name: 'x', email: 'x', createdAt: new Date() };
	}
	async updateUser() {
		return null;
	}
	async deleteUser() {
		return false;
	}
}

class FakeLogger implements ILogger {
	info() {
		return;
	}
	warn() {
		return;
	}
	error() {
		return;
	}
	debug() {
		return;
	}
}

class FakeConfigService implements IConfigService {
	getAppConfig() {
		return { port: 1, environment: 'test', apiVersion: '0.0.0' };
	}
	getDatabaseConfig() {
		return { url: 'x', maxConnections: 1, timeout: 1 };
	}
}

describe('container/resolvers', () => {
	function makeCtx() {
		const container = new Container();
		container.bind<IUserService>(TYPES.UserService).toConstantValue(new FakeUserService());
		container.bind<ILogger>(TYPES.Logger).toConstantValue(new FakeLogger());
		container.bind<IConfigService>(TYPES.ConfigService).toConstantValue(new FakeConfigService());
		return {
			get: (key: string) => (key === 'container' ? container : undefined)
		} as unknown as { get: (key: 'container') => Container };
	}

	it('getService should retrieve instances from context container', () => {
		const ctx = makeCtx();
		const svc = getService<IUserService>(
			ctx as Parameters<typeof getService>[0],
			TYPES.UserService
		);
		expect(svc).toBeDefined();
		expect(typeof svc.getAllUsers).toBe('function');
	});

	it('resolver helpers should return expected services', () => {
		const ctx = makeCtx() as Parameters<typeof getUserService>[0];
		expect(getUserService(ctx)).toBeDefined();
		expect(getLogger(ctx)).toBeDefined();
		expect(getConfigService(ctx)).toBeDefined();
	});
});
