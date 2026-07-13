<script lang="ts">
	import Dice from '$lib/components/Dice.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import {
		startTurn,
		rollTurn,
		setAside,
		canBank,
		bankableScore,
		hasWon,
		scoreSelection,
		FARKLE_CONFIG,
		type FarkleTurn
	} from '$lib/game';

	let turn = $state<FarkleTurn>(startTurn());
	let playerTotal = $state(0);
	let rolling = $state(false);
	let message = $state('Click “Roll” to start your turn.');

	// Bumped each roll so the fly-in transition replays for the new dice.
	let rollId = $state(0);

	// Indices of the current roll the player has tentatively selected.
	let selected = $state<number[]>([]);

	const selectedValues = $derived(selected.map((i) => turn.roll[i]));
	const selection = $derived(scoreSelection(selectedValues));

	// Dice sit on the table waiting to be set aside.
	const hasDiceOnTable = $derived(turn.roll.length > 0);
	const bankable = $derived(canBank(turn, playerTotal) && !hasDiceOnTable);
	const won = $derived(hasWon(playerTotal));

	function toggle(index: number) {
		if (rolling || turn.farkled) return;
		selected = selected.includes(index)
			? selected.filter((i) => i !== index)
			: [...selected, index];
	}

	async function roll() {
		if (rolling || won || hasDiceOnTable) return;
		rolling = true;
		selected = [];
		// Resolve the roll immediately so the dice tumble out to their real values.
		turn = rollTurn(turn);
		rollId += 1;
		// Cup pour + staggered fly-out for each die.
		const settleMs = 500 + turn.roll.length * 100 + 150;
		await new Promise((r) => setTimeout(r, settleMs));
		rolling = false;
		if (turn.farkled) {
			message = '💥 Farkle! No scoring dice — turn score lost.';
		} else if (turn.hotDice) {
			message = '🔥 Hot dice! All six are back in play.';
		} else {
			message = 'Select the scoring dice to set aside.';
		}
	}

	function keepSelection() {
		if (!selection.valid) {
			message = 'That selection contains a non-scoring die.';
			return;
		}
		const result = setAside(turn, selected);
		if (!result.valid) return;
		turn = result.turn;
		selected = [];
		message = turn.hotDice
			? '🔥 Hot dice! Roll all six again or bank.'
			: `Set aside for ${result.points}. Roll again or bank.`;
	}

	function bank() {
		if (!bankable) return;
		playerTotal += bankableScore(turn);
		if (hasWon(playerTotal)) {
			message = `🏆 You won with ${playerTotal} points!`;
		} else {
			message = `Banked! Total is now ${playerTotal}. Roll to start a new turn.`;
		}
		turn = startTurn();
		selected = [];
	}

	function endTurn() {
		// After a Farkle the unbanked score is already 0; just start fresh.
		turn = startTurn();
		selected = [];
		message = 'New turn — click “Roll”.';
	}

	function reset() {
		playerTotal = 0;
		turn = startTurn();
		selected = [];
		rolling = false;
		message = 'Click “Roll” to start your turn.';
	}

	const needsOpening = $derived(
		playerTotal === 0 && turn.turnScore > 0 && turn.turnScore < FARKLE_CONFIG.openingThreshold
	);
</script>

<div class="flex min-h-screen flex-col items-center bg-gray-900 px-4 py-10 text-white">
	<h1 class="mb-2 text-4xl font-bold">🎲 Farkle</h1>
	<p class="mb-8 text-sm text-gray-400">
		First to {FARKLE_CONFIG.winScore.toLocaleString()} · open with {FARKLE_CONFIG.openingThreshold}
	</p>

	<!-- Scoreboard -->
	<div class="mb-8 flex gap-10 text-center">
		<div>
			<div class="text-xs uppercase tracking-wide text-gray-400">Banked</div>
			<div class="text-3xl font-bold">{playerTotal.toLocaleString()}</div>
		</div>
		<div>
			<div class="text-xs uppercase tracking-wide text-gray-400">This turn</div>
			<div class="text-3xl font-bold text-green-400">{turn.turnScore.toLocaleString()}</div>
		</div>
	</div>

	<!-- Roll stage: cup pours the dice out -->
	<div class="roll-stage mb-6">
		<div class="cup" class:pouring={rolling} aria-hidden="true">
			<div class="cup-mouth"></div>
			<div class="cup-body"></div>
		</div>

		<div class="flex min-h-40 flex-wrap items-center justify-center gap-4">
			{#if hasDiceOnTable}
				{#key rollId}
					{#each turn.roll as value, i (i)}
						<div in:fly={{ y: -160, duration: 500, delay: i * 100, easing: cubicOut }}>
							<Dice
								{value}
								{rolling}
								selected={selected.includes(i)}
								disabled={rolling || turn.farkled}
								onclick={() => toggle(i)}
							/>
						</div>
					{/each}
				{/key}
			{:else}
				<p class="text-gray-500">{turn.diceToRoll} dice in the cup — click “Roll”.</p>
			{/if}
		</div>
	</div>

	<!-- Selection preview -->
	{#if hasDiceOnTable && selected.length > 0 && !rolling}
		<p class="mb-4 text-sm {selection.valid ? 'text-green-400' : 'text-red-400'}">
			{selection.valid
				? `Selection scores ${selection.points}`
				: 'Selection includes a non-scoring die'}
		</p>
	{/if}

	<!-- Status message -->
	<p class="mb-6 h-6 text-center text-sm text-gray-300">{message}</p>

	{#if needsOpening}
		<p class="mb-4 text-xs text-amber-400">
			Need {FARKLE_CONFIG.openingThreshold} in one turn to get on the board.
		</p>
	{/if}

	<!-- Controls -->
	<div class="flex flex-wrap justify-center gap-3">
		{#if won}
			<button
				class="rounded-lg bg-indigo-600 px-6 py-2 font-semibold hover:bg-indigo-500"
				onclick={reset}
			>
				New game
			</button>
		{:else if turn.farkled}
			<button
				class="rounded-lg bg-red-600 px-6 py-2 font-semibold hover:bg-red-500"
				onclick={endTurn}
			>
				End turn
			</button>
		{:else}
			<button
				class="rounded-lg bg-indigo-600 px-6 py-2 font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
				onclick={roll}
				disabled={rolling || hasDiceOnTable}
			>
				{turn.hotDice ? 'Roll all 6' : `Roll ${turn.diceToRoll}`}
			</button>
			<button
				class="rounded-lg bg-green-600 px-6 py-2 font-semibold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
				onclick={keepSelection}
				disabled={!selection.valid || selected.length === 0}
			>
				Set aside
			</button>
			<button
				class="rounded-lg bg-amber-600 px-6 py-2 font-semibold hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
				onclick={bank}
				disabled={!bankable}
			>
				Bank {turn.turnScore > 0 ? turn.turnScore : ''}
			</button>
		{/if}
	</div>
</div>

<style>
	.roll-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.cup {
		position: relative;
		width: 96px;
		height: 78px;
		margin-bottom: 4px;
		transform-origin: bottom center;
	}

	.cup-body {
		position: absolute;
		inset: 14px 0 0 0;
		background: linear-gradient(135deg, #a78bfa, #6d28d9);
		clip-path: polygon(14% 0, 86% 0, 72% 100%, 28% 100%);
		box-shadow: inset -8px 0 12px rgba(0, 0, 0, 0.3);
	}

	.cup-mouth {
		position: absolute;
		top: 4px;
		left: 8%;
		right: 8%;
		height: 20px;
		background: radial-gradient(ellipse at center, #4c1d95, #2e1065);
		border: 2px solid #7c3aed;
		border-radius: 50%;
	}

	.cup.pouring {
		animation: pour 0.5s ease;
	}

	@keyframes pour {
		0% {
			transform: rotate(0deg) translateY(0);
		}
		25% {
			transform: rotate(-8deg) translateY(-4px);
		}
		60% {
			transform: rotate(-46deg) translateX(-12px);
		}
		100% {
			transform: rotate(0deg) translateY(0);
		}
	}
</style>
