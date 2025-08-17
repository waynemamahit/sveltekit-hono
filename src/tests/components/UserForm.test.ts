import { fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import UserForm from '../../ui/components/UserForm.svelte';

// Helper function for async operations
const waitForAsync = async () => {
	await tick();
	// Wait for any pending promises
	await new Promise((resolve) => setTimeout(resolve, 0));
	await tick();
};

describe('UserForm', () => {
	it('should render form with all required fields', () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, { onSubmit });

		expect(getByTestId('user-form')).toBeInTheDocument();
		expect(getByTestId('name-input')).toBeInTheDocument();
		expect(getByTestId('email-input')).toBeInTheDocument();
		expect(getByTestId('submit-button')).toBeInTheDocument();
	});

	it('should render with initial values when provided', () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, {
			onSubmit,
			initialName: 'John Doe',
			initialEmail: 'john@example.com'
		});

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		expect(nameInput.value).toBe('John Doe');
		expect(emailInput.value).toBe('john@example.com');
	});

	it('should show loading state when isLoading is true', () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, { onSubmit, isLoading: true });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;
		const submitButton = getByTestId('submit-button') as HTMLButtonElement;

		expect(nameInput.disabled).toBe(true);
		expect(emailInput.disabled).toBe(true);
		expect(submitButton.disabled).toBe(true);
		expect(submitButton).toHaveTextContent('Submitting...');
	});

	it('should validate required fields and show errors', async () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, { onSubmit });

		// Try to submit empty form
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		expect(getByTestId('name-error')).toHaveTextContent('Name is required');
		expect(getByTestId('email-error')).toHaveTextContent('Email is required');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('should validate email format', async () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, { onSubmit });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		// Fill name but invalid email
		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		expect(getByTestId('email-error')).toHaveTextContent('Please enter a valid email');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('should clear errors when user starts typing', async () => {
		const onSubmit = vi.fn();
		const { getByTestId, queryByTestId } = render(UserForm, { onSubmit });

		// First trigger errors
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		expect(getByTestId('name-error')).toBeInTheDocument();

		// Start typing in name field
		const nameInput = getByTestId('name-input') as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'J' } });
		await waitForAsync();

		expect(queryByTestId('name-error')).not.toBeInTheDocument();
	});

	it('should submit form with valid data', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const { getByTestId } = render(UserForm, { onSubmit });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		// Fill form with valid data
		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		expect(onSubmit).toHaveBeenCalledWith({
			name: 'John Doe',
			email: 'john@example.com'
		});
	});

	it('should reset form after successful submission', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const { getByTestId } = render(UserForm, { onSubmit });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		// Fill and submit form
		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		// Check that form is reset
		expect(nameInput.value).toBe('');
		expect(emailInput.value).toBe('');
	});

	it('should handle submission errors gracefully', async () => {
		const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const { getByTestId } = render(UserForm, { onSubmit });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		// Fill and submit form
		await fireEvent.input(nameInput, { target: { value: 'John Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'john@example.com' } });
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		expect(onSubmit).toHaveBeenCalled();
		expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', expect.any(Error));

		consoleSpy.mockRestore();
	});

	it('should trim whitespace from inputs before submission', async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const { getByTestId } = render(UserForm, { onSubmit });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		// Fill form with data that has whitespace
		await fireEvent.input(nameInput, { target: { value: '  John Doe  ' } });
		await fireEvent.input(emailInput, { target: { value: '  john@example.com  ' } });
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		expect(onSubmit).toHaveBeenCalledWith({
			name: 'John Doe',
			email: 'john@example.com'
		});
	});

	it('should have proper accessibility attributes', () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, { onSubmit });

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		expect(nameInput).toHaveAttribute('id', 'name');
		expect(emailInput).toHaveAttribute('id', 'email');
		expect(nameInput).toHaveAttribute('required');
		expect(emailInput).toHaveAttribute('required');
	});

	it('should apply error styles when validation fails', async () => {
		const onSubmit = vi.fn();
		const { getByTestId } = render(UserForm, { onSubmit });

		// Trigger validation errors
		await fireEvent.submit(getByTestId('user-form'));
		await waitForAsync();

		const nameInput = getByTestId('name-input') as HTMLInputElement;
		const emailInput = getByTestId('email-input') as HTMLInputElement;

		expect(nameInput).toHaveClass('border-red-500');
		expect(emailInput).toHaveClass('border-red-500');
	});
});
