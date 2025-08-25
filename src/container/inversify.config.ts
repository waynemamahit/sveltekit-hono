import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Interfaces
import type { IUserService, IUserRepository } from '../interfaces/user.interface';
import type { ILogger, ILoggerFactory } from '../interfaces/logger.interface';
import type { IConfigService } from '../interfaces/config.interface';

// Implementations
import { UserService } from '../services/user.service';
import { UserRepository } from '../services/user.repository';
import { Logger, LoggerFactory } from '../services/logger.service';
import { ConfigService } from '../services/config.service';

// Extend Hono's context to include DI container
declare module 'hono' {
	interface ContextVariableMap {
		container: typeof container;
	}
}

// Create IoC Container
const container = new Container();

// Bind User domain services
container.bind<IUserService>(TYPES.UserService).to(UserService);
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();

// Bind Infrastructure services
container.bind<ILogger>(TYPES.Logger).toConstantValue(new Logger('API'));
container.bind<ILoggerFactory>(TYPES.LoggerFactory).to(LoggerFactory);
container.bind<IConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();

export { container };
