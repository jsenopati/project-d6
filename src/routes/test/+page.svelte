<script lang="ts">
	import { rollDie } from '$lib/game';
	import type { DiceRoll } from '$lib/game';
	import Dice from '$lib/components/Dice.svelte';

	let lastRoll: DiceRoll | null = $state(null);
	let rolling = $state(false);

	async function handleRoll() {
		if (rolling) return;
		rolling = true;
		await new Promise((r) => setTimeout(r, 600));
		lastRoll = rollDie();
		rolling = false;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
	<h1 class="mb-12 text-4xl font-bold">🎲 Dice Test</h1>

	<Dice value={lastRoll?.value ?? null} {rolling} onclick={handleRoll} />

	<p class="mt-8 text-sm text-gray-400">
		{rolling ? 'Rolling...' : 'Click the die to roll'}
	</p>
</div>
