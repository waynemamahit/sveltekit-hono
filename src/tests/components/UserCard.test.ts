import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import UserCard from '../../ui/components/UserCard.svelte';

describe('UserCard', () => {
	it('should render user information correctly', () => {
		const { getByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			}
		});

		expect(getByTestId('user-name')).toHaveTextContent('John Doe');
		expect(getByTestId('user-email')).toHaveTextContent('john@example.com');
		expect(getByTestId('user-card')).toHaveAttribute('data-user-id', '1');
	});

	it('should show delete button when onDelete is provided and not readonly', () => {
		const onDelete = vi.fn();

		const { getByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			},
			onDelete
		});

		expect(getByTestId('delete-button')).toBeInTheDocument();
	});

	it('should not show delete button when readonly is true', () => {
		const onDelete = vi.fn();

		const { queryByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			},
			onDelete,
			readonly: true
		});

		expect(queryByTestId('delete-button')).not.toBeInTheDocument();
	});

	it('should not show delete button when onDelete is not provided', () => {
		const { queryByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			}
		});

		expect(queryByTestId('delete-button')).not.toBeInTheDocument();
	});

	it('should call onDelete with user id when delete button is clicked', () => {
		const onDelete = vi.fn();

		const { getByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			},
			onDelete
		});

		fireEvent.click(getByTestId('delete-button'));

		expect(onDelete).toHaveBeenCalledWith(1);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('should not call onDelete when readonly is true and delete button is clicked', async () => {
		const onDelete = vi.fn();

		// Even though we set readonly to true, the button shouldn't exist
		const { queryByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			},
			onDelete,
			readonly: true
		});

		const deleteButton = queryByTestId('delete-button');
		expect(deleteButton).not.toBeInTheDocument();
		expect(onDelete).not.toHaveBeenCalled();
	});

	it('should have correct CSS classes', () => {
		const { getByTestId } = render(UserCard, {
			user: {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com'
			}
		});

		const card = getByTestId('user-card');
		expect(card).toHaveClass('rounded-lg', 'border', 'bg-white', 'p-4', 'shadow-sm');
	});

	it('should render different user data correctly', () => {
		// Test first user
		const result1 = render(UserCard, {
			user: {
				id: 1,
				name: 'Alice',
				email: 'alice@example.com'
			}
		});
		expect(result1.getByTestId('user-name')).toHaveTextContent('Alice');
		expect(result1.getByTestId('user-email')).toHaveTextContent('alice@example.com');
		result1.unmount();

		// Test second user
		const result2 = render(UserCard, {
			user: {
				id: 2,
				name: 'Bob',
				email: 'bob@example.com'
			}
		});
		expect(result2.getByTestId('user-name')).toHaveTextContent('Bob');
		expect(result2.getByTestId('user-email')).toHaveTextContent('bob@example.com');
		result2.unmount();
	});
});
