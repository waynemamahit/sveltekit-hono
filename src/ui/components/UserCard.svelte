<script lang="ts">
	import { useUserApi } from '$lib/di/context.svelte';
	import type { User } from '../../models/user.model';

	interface Props {
		user: User;
		onDelete?: (id: number) => void;
		readonly?: boolean;
		useDI?: boolean; // Optional: use DI for delete operation
	}

	let { user, onDelete, readonly = false, useDI = false }: Props = $props();

	// Optionally inject API service if useDI is enabled
	const userApi = useDI ? useUserApi() : null;

	let isDeleting = $state(false);

	const handleDelete = async () => {
		if (readonly || isDeleting) return;

		isDeleting = true;
		try {
			// Use DI if enabled, otherwise use callback
			if (useDI && userApi) {
				await userApi.deleteUser(user.id);
				// Notify parent through callback if provided
				if (onDelete) {
					onDelete(user.id);
				}
			} else if (onDelete) {
				await onDelete(user.id);
			}
		} catch (error) {
			console.error('Failed to delete user:', error);
		} finally {
			isDeleting = false;
		}
	};
</script>

<div
	class="rounded-lg border bg-white p-4 shadow-sm"
	data-testid="user-card"
	data-user-id={user.id}
>
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-medium text-gray-900" data-testid="user-name">
				{user.name}
			</h3>
			<p class="text-sm text-gray-600" data-testid="user-email">
				{user.email}
			</p>
		</div>

		{#if !readonly && (onDelete || useDI)}
			<button
				onclick={handleDelete}
				disabled={isDeleting}
				class="rounded-md bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
				data-testid="delete-button"
			>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</button>
		{/if}
	</div>
</div>
