<script lang="ts">
	import type { User } from '../../models/user.model';

	interface Props {
		user: User;
		onDelete?: (id: number) => void;
		readonly?: boolean;
	}

	let { user, onDelete, readonly = false }: Props = $props();

	const handleDelete = () => {
		if (onDelete && !readonly) {
			onDelete(user.id);
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

		{#if !readonly && onDelete}
			<button
				onclick={handleDelete}
				class="rounded-md bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200"
				data-testid="delete-button"
			>
				Delete
			</button>
		{/if}
	</div>
</div>
