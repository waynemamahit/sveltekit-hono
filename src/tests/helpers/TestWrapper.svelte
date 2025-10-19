<script>
	import { initializeDI } from '../../lib/di/context.svelte';

	let { container, component: ComponentToRender, props = {} } = $props();

	// Initialize DI with the provided test container
	initializeDI(container);
</script>

<ComponentToRender {...props} />
