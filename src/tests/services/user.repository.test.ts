import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { UserRepository } from '../../services/user.repository';

// Utility to get a fresh instance for isolation
function createRepo() {
	return new UserRepository();
}

describe('UserRepository', () => {
	it('findAll should return seeded users', async () => {
		const repo = createRepo();
		const users = await repo.findAll();
		expect(users).toHaveLength(2);
		expect(users[0]).toMatchObject({ id: 1, name: 'John Doe' });
	});

	it('findById should return user when exists', async () => {
		const repo = createRepo();
		const user = await repo.findById(1);
		expect(user?.email).toBe('john@example.com');
	});

	it('findById should return null when missing', async () => {
		const repo = createRepo();
		const user = await repo.findById(999);
		expect(user).toBeNull();
	});

	it('create should append a new user with incremented id and createdAt', async () => {
		const repo = createRepo();
		const newUser = await repo.create({
			name: 'New',
			email: 'new@example.com',
			createdAt: new Date('2024-01-10')
		});
		expect(newUser.id).toBeGreaterThan(2);
		expect(newUser.name).toBe('New');
		expect(newUser.email).toBe('new@example.com');
		const all = await repo.findAll();
		expect(all).toHaveLength(3);
	});

	it('update should modify existing user and return updated entity', async () => {
		const repo = createRepo();
		const updated = await repo.update(1, { name: 'Johnny' });
		expect(updated?.name).toBe('Johnny');
	});

	it('update should return null for non-existent user', async () => {
		const repo = createRepo();
		const updated = await repo.update(999, { name: 'X' });
		expect(updated).toBeNull();
	});

	it('delete should remove existing user and return true', async () => {
		const repo = createRepo();
		const ok = await repo.delete(1);
		expect(ok).toBe(true);
		const all = await repo.findAll();
		expect(all.find((u) => u.id === 1)).toBeUndefined();
	});

	it('delete should return false for missing user', async () => {
		const repo = createRepo();
		const ok = await repo.delete(999);
		expect(ok).toBe(false);
	});
});
