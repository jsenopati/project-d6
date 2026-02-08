<script lang="ts">
	type Props = {
		value: number | null;
		rolling?: boolean;
		onclick?: () => void;
	};

	let { value, rolling = false, onclick }: Props = $props();

	// Pip positions for each face (row, col on a 3x3 grid)
	const pipLayouts: Record<number, [number, number][]> = {
		1: [[1, 1]],
		2: [
			[0, 2],
			[2, 0]
		],
		3: [
			[0, 2],
			[1, 1],
			[2, 0]
		],
		4: [
			[0, 0],
			[0, 2],
			[2, 0],
			[2, 2]
		],
		5: [
			[0, 0],
			[0, 2],
			[1, 1],
			[2, 0],
			[2, 2]
		],
		6: [
			[0, 0],
			[0, 2],
			[1, 0],
			[1, 2],
			[2, 0],
			[2, 2]
		]
	};

	let pips = $derived(value ? (pipLayouts[value] ?? []) : []);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dice-wrapper group cursor-pointer select-none" class:rolling {onclick}>
	<div class="dice-face">
		<!-- 3x3 grid for pip placement -->
		{#each Array(3) as _, row}
			{#each Array(3) as _, col}
				<div class="flex items-center justify-center">
					{#if pips.some(([r, c]) => r === row && c === col)}
						<div class="pip"></div>
					{/if}
				</div>
			{/each}
		{/each}
	</div>
</div>

<style>
	.dice-wrapper {
		perspective: 600px;
	}

	.dice-face {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: 140px;
		height: 140px;
		padding: 16px;
		background: linear-gradient(145deg, #ffffff, #e6e6e6);
		border-radius: 18px;
		box-shadow:
			4px 4px 12px rgba(0, 0, 0, 0.4),
			-2px -2px 6px rgba(255, 255, 255, 0.1),
			inset 0 1px 2px rgba(255, 255, 255, 0.6);
		transition: transform 0.15s ease;
	}

	.dice-wrapper:not(.rolling):hover .dice-face {
		transform: scale(1.06) rotateZ(-3deg);
	}

	.dice-wrapper:not(.rolling):active .dice-face {
		transform: scale(0.97);
	}

	.pip {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #444, #111);
		box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5);
	}

	/* Roll animation */
	.rolling .dice-face {
		animation: dice-spin 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@keyframes dice-spin {
		0% {
			transform: rotateX(0deg) rotateY(0deg) scale(1);
		}
		20% {
			transform: rotateX(180deg) rotateY(90deg) scale(0.85);
		}
		50% {
			transform: rotateX(360deg) rotateY(270deg) scale(0.9);
		}
		75% {
			transform: rotateX(540deg) rotateY(360deg) scale(0.95);
		}
		100% {
			transform: rotateX(720deg) rotateY(540deg) scale(1);
		}
	}
</style>
