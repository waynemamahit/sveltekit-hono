import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../../models/user.model';
import UserCard from '../../ui/components/UserCard.svelte';

describe('UserCard Component', () => {
	const mockUser: User = {
		id: 1,
		name: 'John Doe',
		email: 'john@example.com'
	};

	it('should render user information', () => {
		render(UserCard, {
			props: {
				user: mockUser
			}
		});

		expect(screen.getByTestId('user-card')).toBeInTheDocument();
		expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
		expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
	});

	it('should call onDelete callback when delete button is clicked', async () => {
		const onDeleteMock = vi.fn();

		render(UserCard, {
			props: {
				user: mockUser,
				onDelete: onDeleteMock
			}
		});

		const deleteButton = screen.getByTestId('delete-button');
		await fireEvent.click(deleteButton);

		expect(onDeleteMock).toHaveBeenCalledWith(1);
	});

	it('should not show delete button when readonly is true', () => {
		render(UserCard, {
			props: {
				user: mockUser,
				readonly: true
			}
		});

		expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
	});

	it('should not show delete button when no onDelete callback provided', () => {
		render(UserCard, {
			props: {
				user: mockUser
			}
		});

		expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
	});

	it('should disable delete button while deleting', async () => {
		const onDeleteMock = vi
			.fn()
			.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

		render(UserCard, {
			props: {
				user: mockUser,
				onDelete: onDeleteMock
			}
		});

		const deleteButton = screen.getByTestId('delete-button') as HTMLButtonElement;
		expect(deleteButton.disabled).toBe(false);

		// Click delete button
		fireEvent.click(deleteButton);

		// Button should be disabled immediately
		expect(deleteButton.disabled).toBe(true);
		expect(screen.getByText('Deleting...')).toBeInTheDocument();
	});

	it('should display correct user data attributes', () => {
		render(UserCard, {
			props: {
				user: mockUser
			}
		});

		const card = screen.getByTestId('user-card');
		expect(card).toHaveAttribute('data-user-id', '1');
	});
});

describe('UserCard Component - Integration with Mock Data', () => {
	const users: User[] = [
		{ id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
		{ id: 2, name: 'Bob Smith', email: 'bob@example.com' },
		{ id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
	];

	it('should render multiple user cards', () => {
		render(UserCard, {
			props: {
				user: users[0]
			}
		});

		expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
		expect(screen.getByText('alice@example.com')).toBeInTheDocument();
	});

	it('should handle delete for specific user', async () => {
		const deletedUsers: number[] = [];
		const onDelete = (id: number) => {
			deletedUsers.push(id);
		};

		const { unmount } = render(UserCard, {
			props: {
				user: users[1],
				onDelete
			}
		});

		const deleteButton = screen.getByTestId('delete-button');
		await fireEvent.click(deleteButton);

		expect(deletedUsers).toContain(2);
		expect(deletedUsers).toHaveLength(1);

		unmount();
	});
});

describe('UserCard Component - Error Scenarios', () => {
	const mockUser: User = {
		id: 999,
		name: 'Test User',
		email: 'test@example.com'
	};

	it('should handle failed delete gracefully', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const onDeleteMock = vi.fn().mockRejectedValue(new Error('Delete failed'));

		render(UserCard, {
			props: {
				user: mockUser,
				onDelete: onDeleteMock
			}
		});

		const deleteButton = screen.getByTestId('delete-button');
		await fireEvent.click(deleteButton);

		// Wait for async operation
		await new Promise((resolve) => setTimeout(resolve, 100));

		expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete user:', expect.any(Error));

		consoleErrorSpy.mockRestore();
	});
});
