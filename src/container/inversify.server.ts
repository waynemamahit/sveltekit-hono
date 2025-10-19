import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';

// Interfaces
import type { IConfigService } from '../interfaces/config.interface';
import type { ILogger, ILoggerFactory } from '../interfaces/logger.interface';
import type { IUserRepository, IUserService } from '../interfaces/user.interface';

// Implementations
import { ConfigService } from '../services/config.service';
import { Logger, LoggerFactory } from '../services/logger.service';
import { UserRepository } from '../services/user.repository';
import { UserService } from '../services/user.service';

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
