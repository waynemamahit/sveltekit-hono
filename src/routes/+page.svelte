<script lang="ts">
	import { PUBLIC_ENV } from '$lib/env';
	import { onMount } from 'svelte';
	import type { User } from '../models/user.model';
	import type { HealthStatus } from '../types/health';

	let message = $state('');
	let response = $state({});
	let users = $state<User[]>([]);
	let healthStatus = $state<HealthStatus | null>(null);
	let newUser = $state({ name: '', email: '' });
	let isLoading = $state(false);

	onMount(() => {
		fetchInitialData();
	});

	const fetchInitialData = async () => {
		await Promise.all([fetchHello(), fetchHealth(), fetchUsers()]);
	};

	const fetchHello = async () => {
		try {
			const res = await fetch(`${PUBLIC_ENV.API_BASE_URL}/hello`);
			const json = await res.json();
			response = json;
			message = json.message;
		} catch (error) {
			console.error('Error fetching hello:', error);
		}
	};

	const fetchHealth = async () => {
		try {
			const res = await fetch(`${PUBLIC_ENV.API_BASE_URL}/health`);
			healthStatus = await res.json();
		} catch (error) {
			console.error('Error fetching health:', error);
		}
	};

	const fetchUsers = async () => {
		try {
			const res = await fetch(`${PUBLIC_ENV.API_BASE_URL}/users`);
			const json = await res.json();
			users = json.users;
		} catch (error) {
			console.error('Error fetching users:', error);
		}
	};

	const createUser = async (event?: Event) => {
		event?.preventDefault();
		if (!newUser.name || !newUser.email) return;

		isLoading = true;
		try {
			const res = await fetch(`${PUBLIC_ENV.API_BASE_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(newUser)
			});
			const json = await res.json();

			if (res.ok) {
				users = [...users, json.user];
				newUser = { name: '', email: '' };
			}
		} catch (error) {
			console.error('Error creating user:', error);
		} finally {
			isLoading = false;
		}
	};

	const deleteUser = async (id: number) => {
		try {
			const res = await fetch(`${PUBLIC_ENV.API_BASE_URL}/users/${id}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				users = users.filter((user) => user.id !== id);
			}
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
					<form onsubmit={createUser} class="flex flex-col gap-4 sm:flex-row">
						<input
							bind:value={newUser.name}
							placeholder="Name"
							required
							class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
						<input
							bind:value={newUser.email}
							type="email"
							placeholder="Email"
							required
							class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
						<button
							type="submit"
							disabled={isLoading}
							class="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
						>
							{isLoading ? 'Adding...' : 'Add User'}
						</button>
					</form>
				</div>

				<!-- Users List -->
				<div class="rounded-lg border bg-white shadow-sm">
					<div class="border-b p-4">
						<h3 class="text-lg font-semibold">Users ({users.length})</h3>
					</div>
					<div class="divide-y">
						{#each users as user (user.id)}
							<div class="flex items-center justify-between p-4">
								<div>
									<p class="font-medium">{user.name}</p>
									<p class="text-sm text-gray-600">{user.email}</p>
								</div>
								<button
									onclick={() => deleteUser(user.id)}
									class="rounded-md bg-red-100 px-3 py-1 text-sm text-red-700 transition-colors hover:bg-red-200"
								>
									Delete
								</button>
							</div>
						{:else}
							<div class="p-8 text-center text-gray-500">
								No users found. Add some users to get started!
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- API Links -->
			<div class="flex flex-wrap gap-4">
				<a
					href="/api/health"
					target="_blank"
					class="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
				>
					Health Check
				</a>
				<a
					href="/api/hello"
					target="_blank"
					class="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Hello API
				</a>
				<a
					href="/api/users"
					target="_blank"
					class="rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
				>
					Users API
				</a>
			</div>
		</div>
	</div>
</section>
