<script lang="ts">
	type Props = {
		value: number | null;
		rolling?: boolean;
		selected?: boolean;
		disabled?: boolean;
		onclick?: () => void;
	};

	let { value, rolling = false, selected = false, disabled = false, onclick }: Props = $props();

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

	// Rotation that brings each face toward the viewer.
	// Opposite faces sum to 7 (1↔6, 2↔5, 3↔4).
	const faceRotation: Record<number, string> = {
		1: 'rotateX(0deg) rotateY(0deg)',
		2: 'rotateX(-90deg) rotateY(0deg)',
		3: 'rotateX(0deg) rotateY(-90deg)',
		4: 'rotateX(0deg) rotateY(90deg)',
		5: 'rotateX(90deg) rotateY(0deg)',
		6: 'rotateX(0deg) rotateY(180deg)'
	};

	let transform = $derived(faceRotation[value ?? 1]);
</script>

{#snippet pips(n: number)}
	{#each Array(3), row (row)}
		{#each Array(3), col (col)}
			<div class="flex items-center justify-center">
				{#if pipLayouts[n].some(([r, c]) => r === row && c === col)}
					<div class="pip"></div>
				{/if}
			</div>
		{/each}
	{/each}
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="dice-scene select-none"
	class:selected
	class:disabled
	class:cursor-pointer={!disabled}
	onclick={disabled ? undefined : onclick}
>
	<div class="cube" class:rolling style="transform: {transform};">
		<div class="face face-1">{@render pips(1)}</div>
		<div class="face face-2">{@render pips(2)}</div>
		<div class="face face-3">{@render pips(3)}</div>
		<div class="face face-4">{@render pips(4)}</div>
		<div class="face face-5">{@render pips(5)}</div>
		<div class="face face-6">{@render pips(6)}</div>
	</div>
</div>

<style>
	.dice-scene {
		--size: 120px;
		--half: calc(var(--size) / 2);
		width: var(--size);
		height: var(--size);
		perspective: 600px;
		transition:
			transform 0.15s ease,
			filter 0.15s ease;
	}

	.dice-scene:not(.disabled):hover {
		transform: scale(1.06);
	}

	.dice-scene.selected {
		filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.9));
	}

	.dice-scene.disabled {
		opacity: 0.5;
	}

	.cube {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.face {
		position: absolute;
		top: 0;
		left: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 1fr);
		width: var(--size);
		height: var(--size);
		padding: 12px;
		background: linear-gradient(145deg, #ffffff, #dcdcdc);
		border-radius: 16px;
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6);
		backface-visibility: hidden;
	}

	.face-1 {
		transform: translateZ(var(--half));
	}
	.face-2 {
		transform: rotateX(90deg) translateZ(var(--half));
	}
	.face-3 {
		transform: rotateY(90deg) translateZ(var(--half));
	}
	.face-4 {
		transform: rotateY(-90deg) translateZ(var(--half));
	}
	.face-5 {
		transform: rotateX(-90deg) translateZ(var(--half));
	}
	.face-6 {
		transform: rotateY(180deg) translateZ(var(--half));
	}

	.pip {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #444, #111);
		box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5);
	}

	/* Tumble while rolling; overrides the inline face transform for the duration. */
	.cube.rolling {
		animation: tumble 0.6s ease-in-out;
	}

	@keyframes tumble {
		0% {
			transform: rotateX(0deg) rotateY(0deg);
		}
		100% {
			transform: rotateX(720deg) rotateY(1080deg);
		}
	}
</style>
