<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';
	import { onMount } from 'svelte';
	import type { User } from '../../models/user.model';
	import UserCard from './UserCard.svelte';

	interface Props {
		title?: string;
		showAddButton?: boolean;
		onAddClick?: () => void;
		onUserDeleted?: (id: number) => void;
		autoLoad?: boolean;
	}

	let {
		title = 'User List',
		showAddButton = false,
		onAddClick,
		onUserDeleted,
		autoLoad = true
	}: Props = $props();

	// Inject UserApiService via DI
	const userApiService = useUserApi();

	let users = $state<User[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	onMount(() => {
		if (autoLoad) {
			loadUsers();
		}
	});

	const loadUsers = async () => {
		isLoading = true;
		error = null;
		try {
			users = await userApiService.getAllUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load users';
			console.error('Error loading users:', err);
		} finally {
			isLoading = false;
		}
	};

	const handleDeleteUser = async (id: number) => {
		try {
			await userApiService.deleteUser(id);
			users = users.filter((user) => user.id !== id);

			// Notify parent component if callback provided
			if (onUserDeleted) {
				onUserDeleted(id);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete user';
			console.error('Error deleting user:', err);
		}
	};

	const handleRetry = () => {
		loadUsers();
	};

	// Expose methods for parent components
	export const refresh = loadUsers;
	export const addUser = (user: User) => {
		users = [...users, user];
	};
</script>

<div class="w-full" data-testid="user-list">
	<!-- Header -->
	<div class="mb-4 flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
		<div>
			<h3 class="text-lg font-semibold">{title}</h3>
			<p class="text-sm text-gray-600">
				{isLoading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
			</p>
		</div>

		<div class="flex gap-2">
			{#if showAddButton && onAddClick}
				<button
					onclick={onAddClick}
					class="rounded-md bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
					data-testid="add-user-button"
				>
					Add User
				</button>
			{/if}

			<button
				onclick={handleRetry}
				disabled={isLoading}
				class="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
				data-testid="refresh-button"
			>
				{isLoading ? 'Refreshing...' : 'Refresh'}
			</button>
		</div>
	</div>

	<!-- Error State -->
	{#if error}
		<div
			class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
			role="alert"
			data-testid="error-message"
		>
			<div class="flex items-center justify-between">
				<div>
					<h4 class="font-semibold text-red-800">Error</h4>
					<p class="text-sm text-red-600">{error}</p>
				</div>
				<button
					onclick={() => (error = null)}
					class="text-red-600 hover:text-red-800"
					aria-label="Dismiss error"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading && users.length === 0}
		<div class="space-y-4">
			{#each [...Array(3).keys()] as i (i)}
				<div class="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<div class="mb-2 h-4 w-32 rounded bg-gray-200"></div>
							<div class="h-3 w-48 rounded bg-gray-200"></div>
						</div>
						<div class="h-8 w-16 rounded bg-gray-200"></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Users List -->
	{#if !isLoading || users.length > 0}
		<div class="space-y-4" data-testid="users-container">
			{#each users as user (user.id)}
				<UserCard {user} onDelete={handleDeleteUser} />
			{:else}
				{#if !isLoading}
					<div
						class="rounded-lg border bg-white p-8 text-center text-gray-500 shadow-sm"
						data-testid="empty-state"
					>
						<svg
							class="mx-auto mb-4 h-12 w-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							></path>
						</svg>
						<p class="mb-2 text-lg font-medium text-gray-700">No users found</p>
						<p class="text-sm text-gray-500">
							{showAddButton
								? 'Click "Add User" to create your first user'
								: 'Add some users to get started'}
						</p>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
