<script lang="ts">
	import { resolve } from '$app/paths';
	import { useApi } from '$lib/di/context.svelte';
	import { onMount } from 'svelte';
	import type { HelloResponse } from '../interfaces/api.interface';
	import type { User } from '../models/user.model';
	import type { HealthStatus } from '../types/health';
	import UserCard from '../ui/components/UserCard.svelte';
	import UserForm from '../ui/components/UserForm.svelte';

	// Inject API services using DI
	const api = useApi();

	let message = $state('');
	let response = $state<HelloResponse>({} as HelloResponse);
	let users = $state<User[]>([]);
	let healthStatus = $state<HealthStatus | null>(null);
	let isLoading = $state(false);

	onMount(() => {
		fetchInitialData();
	});

	const fetchInitialData = async () => {
		await Promise.all([fetchHello(), fetchHealth(), fetchUsers()]);
	};

	const fetchHello = async () => {
		try {
			const json = await api.hello.getHello();
			response = json;
			message = json.message;
		} catch (error) {
			console.error('Error fetching hello:', error);
		}
	};

	const fetchHealth = async () => {
		try {
			healthStatus = await api.health.checkHealth();
		} catch (error) {
			console.error('Error fetching health:', error);
		}
	};

	const fetchUsers = async () => {
		try {
			users = await api.users.getAllUsers();
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	};

	const createUser = async (userData: { name: string; email: string }) => {
		isLoading = true;
		try {
			const newUser = await api.users.createUser(userData);
			users = [...users, newUser];
		} catch (error) {
			console.error('Error creating user:', error);
			throw error; // Re-throw so UserForm can handle the error
		} finally {
			isLoading = false;
		}
	};

	const deleteUser = async (id: number) => {
		try {
			await api.users.deleteUser(id);
			users = users.filter((user) => user.id !== id);
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	};
</script>

<svelte:head>
	<title>Hono + SvelteKit Starter</title>
	<meta name="description" content="Hono + SvelteKit starter app" />
</svelte:head>

<section class="w-full py-12 md:py-24 lg:py-32">
	<div class="container mx-auto px-4 md:px-6">
		<div class="flex flex-col items-center justify-center space-y-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
					SvelteKit + Hono + Cloudflare
				</h1>
				<p class="mt-4 max-w-[700px] text-gray-600 md:text-xl dark:text-gray-400">
					A modern full-stack application with SvelteKit frontend and Hono API backend, deployable
					to Cloudflare Workers.
				</p>
			</div>

			<!-- Health Status -->
			{#if healthStatus}
				<div class="w-full max-w-md rounded-lg border border-green-200 bg-green-50 p-4">
					<h3 class="font-semibold text-green-800">API Health Status</h3>
					<p class="text-sm text-green-600">
						Status: {healthStatus.status} | Environment: {healthStatus.environment}
					</p>
				</div>
			{/if}

			<!-- Hello API Response -->
			<div class="w-full max-w-2xl">
				<h2 class="mb-4 text-2xl font-bold">Hello API Response</h2>
				<div class="rounded-lg border bg-gray-50 p-4">
					<p class="text-lg font-medium">{!message ? 'Loading...' : message}</p>
					<details class="mt-2">
						<summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
							View full response
						</summary>
						<pre class="mt-2 overflow-auto text-xs">{JSON.stringify(response, null, 2)}</pre>
					</details>
				</div>
			</div>

			<!-- User Management Demo -->
			<div class="w-full max-w-4xl">
				<h2 class="mb-6 text-2xl font-bold">User Management Demo</h2>

				<!-- Add User Form -->
				<div class="mb-6 rounded-lg border bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold">Add New User</h3>
					<UserForm onSubmit={createUser} {isLoading} />
				</div>

				<!-- Users List -->
				<div class="space-y-4">
					<div class="rounded-lg border bg-white p-4 shadow-sm">
						<h3 class="text-lg font-semibold">Users ({users.length})</h3>
					</div>
					{#each users as user (user.id)}
						<UserCard {user} onDelete={deleteUser} />
					{:else}
						<div class="rounded-lg border bg-white p-8 text-center text-gray-500 shadow-sm">
							No users found. Add some users to get started!
						</div>
					{/each}
				</div>
			</div>

			<!-- API Links -->
			<div class="flex flex-wrap gap-4">
				<a
					href={resolve('/di-example')}
					class="rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
				>
					🔌 DI Examples
				</a>
				<a
					href={resolve('/api/health')}
					target="_blank"
					rel="noopener noreferrer"
					data-sveltekit-reload
					class="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
				>
					Health Check
				</a>
				<a
					href={resolve('/api/hello')}
					target="_blank"
					rel="noopener noreferrer"
					data-sveltekit-reload
					class="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Hello API
				</a>
				<a
					href={resolve('/api/users')}
					target="_blank"
					rel="noopener noreferrer"
					data-sveltekit-reload
					class="rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
				>
					Users API
				</a>
			</div>
		</div>
	</div>
</section>
