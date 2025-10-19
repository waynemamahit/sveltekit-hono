<script lang="ts">
	import { resolve } from '$app/paths';
	import { useApi, useHealthApi, useHelloApi } from '$lib/di/context.svelte';
	import { onMount } from 'svelte';
	import type { HealthStatus } from '../../types/health';
	import UserForm from '../../ui/components/UserForm.svelte';
	import UserList from '../../ui/components/UserList.svelte';

	// Example 1: Using individual service hooks
	const healthApi = useHealthApi();
	const helloApi = useHelloApi();

	// Example 2: Using combined API service (Facade pattern)
	const api = useApi();

	let healthStatus = $state<HealthStatus | null>(null);
	let helloMessage = $state('');
	let showUserForm = $state(false);
	let userListRef: UserList;

	onMount(() => {
		loadInitialData();
	});

	const loadInitialData = async () => {
		// Example: Parallel data fetching with individual services
		await Promise.all([fetchHealth(), fetchHello()]);
	};

	const fetchHealth = async () => {
		try {
			// Using individual service hook
			healthStatus = await healthApi.checkHealth();
		} catch (error) {
			console.error('Error fetching health:', error);
		}
	};

	const fetchHello = async () => {
		try {
			// Using individual service hook
			const response = await helloApi.getHello();
			helloMessage = response.message;
		} catch (error) {
			console.error('Error fetching hello:', error);
		}
	};

	const handleCreateUser = async (userData: { name: string; email: string }) => {
		try {
			// Using combined API service (facade)
			const newUser = await api.users.createUser(userData);

			// Add to UserList component
			if (userListRef) {
				userListRef.addUser(newUser);
			}

			showUserForm = false;
		} catch (error) {
			console.error('Error creating user:', error);
			throw error;
		}
	};

	const handleUserDeleted = (id: number) => {
		console.log(`User ${id} was deleted`);
	};
</script>

<svelte:head>
	<title>Dependency Injection Examples - SvelteKit + Hono</title>
	<meta name="description" content="Examples of using dependency injection in Svelte components" />
</svelte:head>

<section class="w-full py-12 md:py-24">
	<div class="container mx-auto px-4 md:px-6">
		<div class="flex flex-col space-y-8">
			<!-- Page Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
					Dependency Injection Examples
				</h1>
				<p class="mx-auto mt-4 max-w-[700px] text-gray-600 md:text-xl">
					Demonstrating various DI patterns with InversifyJS in SvelteKit
				</p>
			</div>

			<!-- Pattern 1: Individual Service Hooks -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-2xl font-bold text-gray-900">Pattern 1: Individual Service Hooks</h2>
				<p class="mb-4 text-gray-600">
					Using specific service hooks like <code class="rounded bg-gray-100 px-2 py-1"
						>useHealthApi()</code
					>,
					<code class="rounded bg-gray-100 px-2 py-1">useHelloApi()</code>
				</p>

				<div class="grid gap-4 md:grid-cols-2">
					{#if healthStatus}
						<div class="rounded border border-green-200 bg-green-50 p-4">
							<h3 class="font-semibold text-green-800">Health Status</h3>
							<p class="text-sm text-green-600">
								Status: {healthStatus.status}
							</p>
							<p class="text-sm text-green-600">
								Environment: {healthStatus.environment}
							</p>
							<p class="mt-2 text-xs text-gray-500">
								Fetched using: <code>useHealthApi()</code>
							</p>
						</div>
					{/if}

					<div class="rounded border border-blue-200 bg-blue-50 p-4">
						<h3 class="font-semibold text-blue-800">Hello API</h3>
						<p class="text-sm text-blue-600">
							{helloMessage || 'Loading...'}
						</p>
						<p class="mt-2 text-xs text-gray-500">
							Fetched using: <code>useHelloApi()</code>
						</p>
					</div>
				</div>

				<details class="mt-4">
					<summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
						View Code Example
					</summary>
					<pre class="mt-2 overflow-auto rounded bg-gray-900 p-4 text-sm text-gray-100"><code
							>{`// Import individual service hooks
import { useHealthApi, useHelloApi } from '$lib/di/context.svelte';

// Inject services
const healthApi = useHealthApi();
const helloApi = useHelloApi();

// Use the services
const healthStatus = await healthApi.checkHealth();
const hello = await helloApi.getHello();`}</code
						></pre>
				</details>
			</div>

			<!-- Pattern 2: Combined API Service (Facade) -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-2xl font-bold text-gray-900">
					Pattern 2: Combined API Service (Facade)
				</h2>
				<p class="mb-4 text-gray-600">
					Using a single <code class="rounded bg-gray-100 px-2 py-1">useApi()</code> hook to access all
					services
				</p>

				<div class="rounded border border-purple-200 bg-purple-50 p-4">
					<h3 class="font-semibold text-purple-800">API Facade Pattern</h3>
					<p class="text-sm text-purple-600">
						Access users, health, and hello services through a single interface
					</p>
					<p class="mt-2 text-xs text-gray-500">
						Usage: <code>api.users.getAllUsers()</code>, <code>api.health.checkHealth()</code>
					</p>
				</div>

				<details class="mt-4">
					<summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
						View Code Example
					</summary>
					<pre class="mt-2 overflow-auto rounded bg-gray-900 p-4 text-sm text-gray-100"><code
							>{`// Import combined API service
import { useApi } from '$lib/di/context.svelte';

// Inject combined service
const api = useApi();

// Use all services through the facade
const users = await api.users.getAllUsers();
const health = await api.health.checkHealth();
const hello = await api.hello.getHello();

// Create a new user
const newUser = await api.users.createUser({
  name: 'John Doe',
  email: 'john@example.com'
});`}</code
						></pre>
				</details>
			</div>

			<!-- Pattern 3: Component-Level DI -->
			<div class="rounded-lg border bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-2xl font-bold text-gray-900">Pattern 3: Component-Level DI</h2>
				<p class="mb-4 text-gray-600">
					Components that manage their own data using injected services
				</p>

				<div class="mb-4 flex items-center justify-between">
					<p class="text-sm text-gray-600">
						The UserList component below uses <code class="rounded bg-gray-100 px-2 py-1"
							>useUserApi()</code
						> internally
					</p>
					<button
						onclick={() => (showUserForm = !showUserForm)}
						class="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						{showUserForm ? 'Cancel' : 'Add User'}
					</button>
				</div>

				{#if showUserForm}
					<div class="mb-6 rounded-lg border bg-gray-50 p-4">
						<h3 class="mb-4 text-lg font-semibold">Create New User</h3>
						<UserForm onSubmit={handleCreateUser} />
					</div>
				{/if}

				<UserList
					bind:this={userListRef}
					title="Users (Component-Level DI)"
					onUserDeleted={handleUserDeleted}
				/>

				<details class="mt-4">
					<summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
						View Code Example
					</summary>
					<pre class="mt-2 overflow-auto rounded bg-gray-900 p-4 text-sm text-gray-100"><code
							>{`// Inside UserList.svelte component
import { useUserApi } from '$lib/di/context.svelte';

// Component injects its own dependencies
const userApiService = useUserApi();

// Component manages its own data
const loadUsers = async () => {
  users = await userApiService.getAllUsers();
};

const deleteUser = async (id: number) => {
  await userApiService.deleteUser(id);
  users = users.filter(u => u.id !== id);
};`}</code
						></pre>
				</details>
			</div>

			<!-- Benefits Section -->
			<div class="rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm">
				<h2 class="mb-4 text-2xl font-bold text-gray-900">Benefits of Dependency Injection</h2>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="rounded bg-white p-4 shadow-sm">
						<h3 class="mb-2 font-semibold text-blue-800">🧪 Testability</h3>
						<p class="text-sm text-gray-600">
							Easy to mock services for unit testing components in isolation
						</p>
					</div>
					<div class="rounded bg-white p-4 shadow-sm">
						<h3 class="mb-2 font-semibold text-green-800">🔄 Reusability</h3>
						<p class="text-sm text-gray-600">
							Services can be reused across multiple components without duplication
						</p>
					</div>
					<div class="rounded bg-white p-4 shadow-sm">
						<h3 class="mb-2 font-semibold text-purple-800">🎯 Maintainability</h3>
						<p class="text-sm text-gray-600">
							Centralized service configuration makes updates easier
						</p>
					</div>
					<div class="rounded bg-white p-4 shadow-sm">
						<h3 class="mb-2 font-semibold text-orange-800">🔌 Flexibility</h3>
						<p class="text-sm text-gray-600">
							Easy to swap implementations without changing component code
						</p>
					</div>
				</div>
			</div>

			<!-- Navigation -->
			<div class="flex justify-center gap-4">
				<a
					href={resolve('/')}
					class="rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
				>
					← Back to Home
				</a>
				<a
					href={resolve('/api/users')}
					target="_blank"
					rel="noopener noreferrer"
					data-sveltekit-reload
					class="rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
				>
					View API Response
				</a>
			</div>
		</div>
	</div>
</section>
