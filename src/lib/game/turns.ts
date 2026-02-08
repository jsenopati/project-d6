/**
 * Turn management logic.
 * Tracks whose turn it is and cycles through players.
 */

export interface Player {
	id: string;
	name: string;
	score: number;
}

export interface GameState {
	players: Player[];
	currentTurnIndex: number;
	phase: 'lobby' | 'playing' | 'finished';
	round: number;
}

/** Create a fresh game state with the given players. */
export function createGameState(players: Pick<Player, 'id' | 'name'>[]): GameState {
	return {
		players: players.map((p) => ({ ...p, score: 0 })),
		currentTurnIndex: 0,
		phase: 'lobby',
		round: 1
	};
}

/** Get the player whose turn it currently is. */
export function getCurrentPlayer(state: GameState): Player | undefined {
	return state.players[state.currentTurnIndex];
}

/** Advance to the next player's turn. Wraps around and increments round. */
export function advanceTurn(state: GameState): GameState {
	const nextIndex = (state.currentTurnIndex + 1) % state.players.length;
	const nextRound = nextIndex === 0 ? state.round + 1 : state.round;

	return {
		...state,
		currentTurnIndex: nextIndex,
		round: nextRound
	};
}

/** Apply a score to the current player. */
export function applyScore(state: GameState, points: number): GameState {
	const players = state.players.map((p, i) =>
		i === state.currentTurnIndex ? { ...p, score: p.score + points } : p
	);
	return { ...state, players };
}
