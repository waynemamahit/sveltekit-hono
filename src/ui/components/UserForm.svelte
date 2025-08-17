<script lang="ts">
	interface Props {
		onSubmit: (userData: { name: string; email: string }) => Promise<void>;
		isLoading?: boolean;
		initialName?: string;
		initialEmail?: string;
	}

	let { onSubmit, isLoading = false, initialName = '', initialEmail = '' }: Props = $props();

	let name = $state(initialName);
	let email = $state(initialEmail);
	let errors = $state<{ name?: string; email?: string }>({});

	const validateForm = () => {
		const newErrors: { name?: string; email?: string } = {};

		if (!name.trim()) {
			newErrors.name = 'Name is required';
		}

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = 'Please enter a valid email';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (event: Event) => {
		event.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			await onSubmit({ name: name.trim(), email: email.trim() });
			// Reset form on successful submission
			name = '';
			email = '';
			errors = {};
		} catch (error) {
			console.error('Form submission error:', error);
		}
	};

	const handleInputChange = (field: 'name' | 'email') => {
		// Clear error for field when user starts typing
		if (errors[field]) {
			errors = { ...errors, [field]: undefined };
		}
	};
</script>

<form onsubmit={handleSubmit} class="space-y-4" data-testid="user-form" novalidate>
	<div>
		<label for="name" class="block text-sm font-medium text-gray-700"> Name </label>
		<input
			id="name"
			bind:value={name}
			oninput={() => handleInputChange('name')}
			placeholder="Enter name"
			required
			disabled={isLoading}
			class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
			class:border-red-500={errors.name}
			data-testid="name-input"
		/>
		{#if errors.name}
			<p class="mt-1 text-sm text-red-600" data-testid="name-error">
				{errors.name}
			</p>
		{/if}
	</div>

	<div>
		<label for="email" class="block text-sm font-medium text-gray-700"> Email </label>
		<input
			id="email"
			type="email"
			bind:value={email}
			oninput={() => handleInputChange('email')}
			placeholder="Enter email"
			required
			disabled={isLoading}
			class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
			class:border-red-500={errors.email}
			data-testid="email-input"
		/>
		{#if errors.email}
			<p class="mt-1 text-sm text-red-600" data-testid="email-error">
				{errors.email}
			</p>
		{/if}
	</div>

	<button
		type="submit"
		disabled={isLoading}
		class="w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
		data-testid="submit-button"
	>
		{isLoading ? 'Submitting...' : 'Add User'}
	</button>
</form>
