import { injectable } from 'inversify';
import type { IUserRepository, User } from '../interfaces/user.interface';

// Single Responsibility Principle - Only handles data access
@injectable()
export class UserRepository implements IUserRepository {
	private users: User[] = [
		{
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			createdAt: new Date('2024-01-01')
		},
		{
			id: 2,
			name: 'Jane Smith',
			email: 'jane@example.com',
			createdAt: new Date('2024-01-02')
		}
	];

	async findById(id: number): Promise<User | null> {
		const user = this.users.find((u) => u.id === id);
		return user || null;
	}

	async findAll(): Promise<User[]> {
		return [...this.users];
	}

	async create(userData: Omit<User, 'id'>): Promise<User> {
		const newUser: User = {
			id: Math.max(...this.users.map((u) => u.id), 0) + 1,
			...userData,
			createdAt: new Date()
		};
		this.users.push(newUser);
		return newUser;
	}

	async update(id: number, userData: Partial<User>): Promise<User | null> {
		const userIndex = this.users.findIndex((u) => u.id === id);
		if (userIndex === -1) return null;

		this.users[userIndex] = {
			...this.users[userIndex],
			...userData
		};
		return this.users[userIndex];
	}

	async delete(id: number): Promise<boolean> {
		const userIndex = this.users.findIndex((u) => u.id === id);
		if (userIndex === -1) return false;

		this.users.splice(userIndex, 1);
		return true;
	}
}
